package main

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getDatabaseNodeResults(cur *mongo.Cursor, dataType interface{}) ([]interface{}, error) {
	out := make([]interface{}, 0)
	for cur.Next(context.Background()) {
		rawData, err := bson.Marshal(cur.Current)
		if err != nil {
			return nil, err
		}
		switch dataType.(type) {
		case NodeTop, *NodeTop:
			{
				n := &NodeTop{}
				if err := bson.Unmarshal(rawData, &n); err != nil {
					return nil, err
				}
				out = append(out, n)
				break
			}
		case NodeVersion, *NodeVersion:
			{
				n := &NodeVersion{}
				if err := bson.Unmarshal(rawData, &n); err != nil {
					return nil, err
				}
				out = append(out, n)
				break
			}
		case Node, *Node:
			{
				n := &Node{}
				if err := bson.Unmarshal(rawData, &n); err != nil {
					return nil, err
				}
				out = append(out, n)
				break
			}
		}
	}
	return out, nil
}

func databaseNodeRawQuery(nodeType interface{}, filters interface{}, offset int) ([]interface{}, int, error) {
	// get collection
	col, err := DatabaseCollectionFromData(nodeType)
	if err != nil {
		return nil, 0, err
	}
	// set fetch options
	opts := options.Find()
	opts.SetSort(bson.D{{Key: "version", Value: -1}, {Key: "modified", Value: -1}})
	if offset >= 0 {
		opts.SetLimit(dbFetchLimit)
		opts.SetSkip(int64(offset))
	}
	// do count
	count := int64(0)
	if offset >= 0 {
		count, err = col.CountDocuments(context.Background(), filters)
		if err != nil {
			return nil, 0, err
		}
	}
	// do fetch
	cur, err := col.Find(context.Background(), filters, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(context.Background())
	// convert back to go structs
	res, err := getDatabaseNodeResults(cur, nodeType)
	if count == 0 {
		count = int64(len(res))
	}
	return res, int(count), err
}

func DatabaseNodeTopFetch(uid string) (*NodeTop, error) {
	// get collection
	col, err := DatabaseCollectionFromData(NodeTop{})
	if err != nil {
		return nil, err
	}
	// fetch
	res := col.FindOne(context.Background(), bson.M{"uid": uid})
	err = res.Err()
	if err != nil {
		return nil, err
	}
	// decode
	n := &NodeTop{}
	if err := res.Decode(n); err != nil {
		return nil, err
	}
	return n, err
}

func DatabaseNodeTopList(parent string, nodeType NodeType, offset int) ([]*NodeTop, int, error) {
	// filters
	filters := bson.M{"type": string(nodeType), "parent": parent}
	// fetch
	res, count, err := databaseNodeRawQuery(NodeTop{}, filters, offset)
	if err != nil {
		return nil, 0, err
	}
	// convert interface{} to NodeTop
	out := make([]*NodeTop, 0)
	for _, n := range res {
		out = append(out, n.(*NodeTop))
	}
	return out, count, nil
}

func DatabaseNodeVersionList(uid string, offset int) ([]*NodeVersion, int, error) {
	// fetch
	res, count, err := databaseNodeRawQuery(NodeVersion{}, bson.M{"uid": uid}, offset)
	if err != nil {
		return nil, 0, err
	}
	// convert interface{} to NodeVersion
	out := make([]*NodeVersion, 0)
	for _, n := range res {
		out = append(out, n.(*NodeVersion))
	}
	return out, count, nil
}

func DatabaseNodeVersionLatest(uid string) (int, error) {
	// get collection
	col, err := DatabaseCollectionFromData(NodeVersion{})
	if err != nil {
		return 0, err
	}
	// set fetch options
	opts := options.FindOne()
	opts.SetSort(bson.M{"version": -1})
	// fetch
	res := col.FindOne(context.Background(), bson.M{"uid": uid}, opts)
	if err := res.Err(); err != nil {
		return 0, err
	}
	n := &NodeVersion{}
	if err := res.Decode(n); err != nil {
		return 0, err
	}
	return n.Version, nil
}

func DatabaseNodeVersionExists(uid string, version int) (bool, error) {
	// get collection
	col, err := DatabaseCollectionFromData(NodeVersion{})
	if err != nil {
		return false, err
	}
	// fetch
	res := col.FindOne(context.Background(), bson.M{"uid": uid, "version": version})
	if err := res.Err(); err != nil {
		if errors.Is(err, mongo.ErrNilDocument) {
			return false, nil
		}
		return false, err
	}
	n := &NodeVersion{}
	if err := res.Decode(n); err != nil {
		return false, err
	}
	return true, nil
}

func DatabaseNodeList(rootUid string, version int, parent string) ([]*Node, error) {
	// filters
	filters := bson.M{"path": rootUid, "version": version}
	if parent != "" {
		filters["path"] = bson.M{"$all": bson.A{parent, rootUid}}
	}
	// fetch
	res, _, err := databaseNodeRawQuery(Node{}, filters, -1)
	if err != nil {
		return nil, err
	}
	// convert interface{} to Node
	out := make([]*Node, 0)
	for _, n := range res {
		out = append(out, n.(*Node))
	}
	return out, nil
}

func DatabaseNodeTopStore(nodeTop *NodeTop) error {
	if nodeTop == nil || nodeTop.UID == "" {
		return ErrNodeMissingUID
	}
	// get collection
	col, err := DatabaseCollectionFromData(nodeTop)
	if err != nil {
		return err
	}
	// update created/modified
	nodeTop.Modified = time.Now()
	if (nodeTop.Created == time.Time{}) {
		nodeTop.Created = nodeTop.Modified
	}
	// generate bson document
	doc, err := toBSONDoc(nodeTop)
	if err != nil {
		return err
	}
	// options
	opts := options.Update()
	opts.SetUpsert(true)
	// build filters
	filter := bson.M{"uid": nodeTop.UID, "parent": nodeTop.Parent}
	// store
	_, err = col.UpdateOne(context.Background(), filter, bson.D{{Key: "$set", Value: doc}}, opts)
	return err
}

func DatabaseNodeVersionNew(data *NodeVersion) (int, error) {
	if data == nil || data.UID == "" {
		return 0, ErrNodeMissingUID
	}
	// fetch last version
	version, err := DatabaseNodeVersionLatest(data.UID)
	if err != nil && errors.Is(err, mongo.ErrNilDocument) {
		return 0, err
	}
	// inc version
	data.Version = version + 1
	data.State = NodeDraft
	data.Created = time.Now()
	data.Modified = data.Created
	// get collection
	col, err := DatabaseCollectionFromData(data)
	if err != nil {
		return 0, err
	}
	// generate bson document
	doc, err := toBSONDoc(data)
	if err != nil {
		return 0, err
	}
	// insert
	_, err = col.InsertOne(context.Background(), doc)
	return data.Version, err
}

func DatabaseNodeVersionUpdate(data *NodeVersion) error {
	if data == nil || data.UID == "" {
		return ErrNodeMissingUID
	}
	if data.Version <= 0 {
		return ErrNodeMissingParam
	}
	data.Modified = time.Now()
	// get collection
	col, err := DatabaseCollectionFromData(data)
	if err != nil {
		return err
	}
	// generate bson document
	doc, err := toBSONDoc(data)
	if err != nil {
		return err
	}
	// update
	_, err = col.UpdateOne(
		context.Background(),
		bson.M{"uid": data.UID, "version": data.Version},
		bson.D{{Key: "$set", Value: doc}},
	)
	return err
}

func DatabaseNodeStore(nodes []*Node) error {
	// check and adjust node list
	if nodes == nil {
		return ErrNoData
	}
	NodeListResolvePathes(nodes)
	if err := NodeListCheck(nodes); err != nil {
		return err
	}
	// check version
	hasVersion, err := DatabaseNodeVersionExists(nodes[0].Root(), nodes[0].Version)
	if err != nil {
		return err
	}
	if !hasVersion {
		return ErrNodeVersionNotFound
	}
	// get collection
	col, err := DatabaseCollectionFromData(nodes[0])
	if err != nil {
		return err
	}
	writeModels := make([]mongo.WriteModel, 0)
	for _, node := range nodes {
		// generate bson document
		doc, err := toBSONDoc(node)
		if err != nil {
			return err
		}
		// make model
		model := mongo.NewUpdateOneModel()
		model.SetUpsert(true)
		model.SetFilter(bson.M{"path": node.Root(), "version": node.Version, "uid": node.UID})
		model.SetUpdate(bson.D{{Key: "$set", Value: doc}})
		writeModels = append(writeModels, model)
	}
	_, err = col.BulkWrite(context.Background(), writeModels)
	return err
}
