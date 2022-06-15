package main

import "go.mongodb.org/mongo-driver/bson"

func DatabaseSubmissionFetch(key string, rootUid string, rootVersion int) (*Submission, error) {
	res, err := databaseFetch(Submission{}, bson.M{"key": key, "root_uid": rootUid, "root_version": rootVersion}, nil)
	if err != nil {
		return nil, err
	}
	return res.(*Submission), nil
}

func DatabaseSubmissionList(rootUid string, version int, sort interface{}, offset int) ([]*Submission, int, error) {
	filter := bson.M{"root_uid": rootUid}
	if version > 0 {
		filter["root_version"] = version
	}
	res, count, err := databaseList(Submission{}, filter, sort, nil, offset)
	if err != nil {
		return nil, 0, err
	}
	out := make([]*Submission, 0)
	for _, i := range res {
		out = append(out, i.(*Submission))
	}
	return out, count, nil
}

func DatabaseSubmissionStore(u *Submission) error {
	return databaseStoreOne(u)
}

func DatabaseSubmissionDelete(key string, rootUid string, rootVersion int) error {
	return databaseDelete(Submission{}, bson.M{"key": key, "root_uid": rootUid, "root_version": rootVersion})
}
