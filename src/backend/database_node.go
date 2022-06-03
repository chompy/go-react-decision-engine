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

func databaseNodeRawQuery(nodeType interface{}, filters bson.M, offset int) ([]interface{}, error) {
	// get collection
	col, err := DatabaseCollectionFromData(nodeType)
	if err != nil {
		return nil, err
	}
	// set fetch options
	opts := options.Find()
	opts.SetSort(bson.M{"version": -1, "modified": -1})
	opts.SetLimit(dbFetchLimit)
	opts.SetSkip(int64(offset))
	// do fetch
	cur, err := col.Find(context.Background(), filters, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(context.Background())
	// convert back to go structs
	return getDatabaseNodeResults(cur, nodeType)
}

func databaseNodeTopList(value string, nodeType NodeType, offset int) ([]*NodeTop, error) {
	// filters
	filters := bson.M{"type": string(nodeType)}
	switch nodeType {
	case NodeForm:
		{
			filters["team"] = value
			break
		}
	default:
		{
			filters["parent"] = value
			break
		}
	}
	// fetch
	res, err := databaseNodeRawQuery(NodeTop{}, filters, offset)
	if err != nil {
		return nil, err
	}
	// convert interface{} to NodeTop
	out := make([]*NodeTop, 0)
	for _, n := range res {
		out = append(out, n.(*NodeTop))
	}
	return out, nil
}

func DatabaseFormList(team string, offset int) ([]*NodeTop, error) {
	return databaseNodeTopList(team, NodeForm, offset)
}

func DatabaseDocumentList(parent string, offset int) ([]*NodeTop, error) {
	return databaseNodeTopList(parent, NodeDocument, offset)
}

func DatabaseNodeVersionList(uid string, offset int) ([]*NodeVersion, error) {
	// fetch
	res, err := databaseNodeRawQuery(NodeVersion{}, bson.M{"uid": uid}, offset)
	if err != nil {
		return nil, err
	}
	// convert interface{} to NodeVersion
	out := make([]*NodeVersion, 0)
	for _, n := range res {
		out = append(out, n.(*NodeVersion))
	}
	return out, nil
}

func DatabaseNodeLatestVersion(uid string) (int, error) {
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

func DatabaseNodeList(rootUid string, version int, offset int) ([]*Node, error) {
	// fetch
	res, err := databaseNodeRawQuery(NodeVersion{}, bson.M{"root": rootUid, "version": version}, offset)
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

func databaseNodeStore(data interface{}) error {
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
	// uid required
	uid, ver := getNodeUidVersion(data)
	if uid == "" {
		return ErrNodeMissingUID
	}
	// options
	opts := options.Update()
	opts.SetUpsert(true)
	// build filters
	filter := bson.M{"uid": uid}
	if ver > 0 {
		filter["version"] = ver
	}
	// store
	_, err = col.UpdateOne(context.Background(), filter, doc, opts)
	return err
}

func DatabaseFormStore(data *NodeTop) error {
	return databaseNodeStore(data)
}

func DatabaseNodeNewVersion(data *NodeVersion) (int, error) {
	if data == nil || data.UID == "" {
		return 0, ErrNodeMissingUID
	}
	// fetch last version
	version, err := DatabaseNodeLatestVersion(data.UID)
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

func DatabaseNodeUpdateVersion(data *NodeVersion) error {
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
	_, err = col.UpdateOne(context.Background(), bson.M{"uid": data.UID, "version": data.Version}, doc)
	return err
}
