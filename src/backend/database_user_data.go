package main

import "go.mongodb.org/mongo-driver/bson"

func DatabaseUserDataFetch(key string, rootUid string, rootVersion int) (*UserData, error) {
	res, err := databaseFetch(UserData{}, bson.M{"key": key, "root_uid": rootUid, "root_version": rootVersion}, nil)
	if err != nil {
		return nil, err
	}
	return res.(*UserData), nil
}

func DatabaseUserDataList(rootUid string, version int, sort interface{}, offset int) ([]*UserData, int, error) {
	filter := bson.M{"root_uid": rootUid}
	if version > 0 {
		filter["root_version"] = version
	}
	res, count, err := databaseList(UserData{}, filter, sort, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	out := make([]*UserData, 0)
	for _, i := range res {
		out = append(out, i.(*UserData))
	}
	return out, count, nil
}

func DatabaseUserDataStore(u *UserData) error {
	return databaseStoreOne(u)
}

func DatabaseUserDataDelete(key string, rootUid string, rootVersion int) error {
	return databaseDelete(UserData{}, bson.M{"key": key, "root_uid": rootUid, "root_version": rootVersion})
}
