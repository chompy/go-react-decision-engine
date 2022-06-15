package main

import (
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/mongo"

	"go.mongodb.org/mongo-driver/bson"
)

func DatabaseNodeTopFetch(uid string) (*NodeTop, error) {
	res, err := databaseFetch(NodeTop{}, bson.M{"uid": uid}, nil)
	if err != nil {
		return nil, err
	}
	return res.(*NodeTop), nil
}

func DatabaseNodeTopList(parent string, nodeType NodeType, offset int) ([]*NodeTop, int, error) {
	filters := bson.M{"type": string(nodeType), "parent": parent}
	res, count, err := databaseList(NodeTop{}, filters, bson.M{"modified": -1}, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	out := make([]*NodeTop, 0)
	for _, item := range res {
		out = append(out, item.(*NodeTop))
	}
	return out, count, nil
}

func DatabaseNodeVersionFetch(uid string, version int) (*NodeVersion, error) {
	res, err := databaseFetch(NodeVersion{}, bson.M{"uid": uid, "version": version}, nil)
	if err != nil {
		return nil, err
	}
	return res.(*NodeVersion), nil
}

func DatabaseNodeVersionList(uid string, offset int) ([]*NodeVersion, int, error) {
	filters := bson.M{"uid": uid}
	res, count, err := databaseList(NodeVersion{}, filters, bson.M{"modified": -1}, bson.M{"tree": 0}, offset)
	if err != nil {
		return nil, 0, err
	}
	out := make([]*NodeVersion, 0)
	for _, item := range res {
		out = append(out, item.(*NodeVersion))
	}
	return out, count, nil
}

func DatabaseNodeVersionLatest(uid string) (*NodeVersion, error) {
	res, err := databaseFetch(NodeVersion{}, bson.M{"uid": uid}, bson.M{"version": -1})
	if err != nil {
		return nil, err
	}
	return res.(*NodeVersion), nil
}

func DatabaseNodeVersionExists(uid string, version int) (bool, error) {
	count, err := databaseCount(NodeVersion{}, bson.M{"uid": uid, "version": version})
	if err != nil || count == 0 {
		return false, err
	}
	return true, nil
}

func DatabaseNodeTopStore(nodeTop *NodeTop) error {
	if nodeTop == nil {
		return ErrNoData
	}
	// generate uid
	if nodeTop.UID == "" {
		nodeTop.UID = generateUID()
		nodeTop.Created = time.Now()
	}
	// update modified
	nodeTop.Modified = time.Now()
	// store
	return databaseStoreOne(nodeTop)
}

func DatabaseNodeTopDelete(uid string) error {
	if uid == "" {
		return ErrNoData
	}
	if err := databaseDelete(NodeTop{}, bson.M{"uid": uid}); err != nil {
		return err
	}
	if err := databaseDelete(NodeVersion{}, bson.M{"uid": uid}); err != nil {
		return err
	}
	return nil
}

func DatabaseNodeVersionNew(data *NodeVersion) (int, error) {
	if data == nil || data.UID == "" {
		return 0, ErrNodeMissingUID
	}
	// fetch last version
	latestVersion, err := DatabaseNodeVersionLatest(data.UID)
	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		return 0, err
	}
	// inc version
	data.Version = 1
	if latestVersion != nil {
		data.Version = latestVersion.Version + 1
	}
	data.State = NodeDraft
	data.Created = time.Now()
	data.Modified = data.Created
	// store
	return data.Version, databaseStoreOne(data)
}

func DatabaseNodeVersionUpdate(data *NodeVersion) error {
	if data == nil || data.UID == "" {
		return ErrNodeMissingUID
	}
	if data.Version <= 0 {
		return ErrNodeMissingParam
	}
	data.Modified = time.Now()
	return databaseStoreOne(data)
}

func DatabaseNodeVersionDelete(uid string, version int) error {
	if uid == "" || version <= 0 {
		return ErrNoData
	}
	if err := databaseDelete(NodeVersion{}, bson.M{"uid": uid, "version": version}); err != nil {
		return err
	}
	return nil
}
