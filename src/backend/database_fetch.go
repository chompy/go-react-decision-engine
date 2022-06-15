package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func databaseReadResults(dataType interface{}, cur *mongo.Cursor) ([]interface{}, error) {
	out := make([]interface{}, 0)
	for cur.Next(databaseContext()) {
		rawData, err := bson.Marshal(cur.Current)
		if err != nil {
			return nil, err
		}
		data := getEmptyStruct(dataType)
		if err := bson.Unmarshal(rawData, data); err != nil {
			return nil, err
		}
		out = append(out, data)
	}
	return out, nil
}

func databaseList(dataType interface{}, filter interface{}, sort interface{}, projection interface{}, offset int) ([]interface{}, int, error) {
	// missing params
	if dataType == nil || filter == nil {
		return nil, 0, ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(dataType)
	if err != nil {
		return nil, 0, err
	}
	// set fetch options
	opts := options.Find()
	// sort
	if sort == nil {
		sort = bson.D{{Key: "modified", Value: -1}}
	}
	opts.SetSort(sort)
	// offset / limit
	opts.SetLimit(dbFetchLimit)
	if offset > 0 {
		opts.SetSkip(int64(offset))
	}
	// projection
	if projection != nil {
		opts.SetProjection(projection)
	}
	// do count
	count, err := databaseCount(dataType, filter)
	if err != nil {
		return nil, 0, err
	}
	// do fetch
	cur, err := col.Find(databaseContext(), filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(databaseContext())
	// convert back to go structs
	res, err := databaseReadResults(dataType, cur)
	if count == 0 {
		count = len(res)
	}
	return res, count, err
}

func databaseFetch(dataType interface{}, filter interface{}, sort interface{}) (interface{}, error) {
	// missing params
	if dataType == nil || filter == nil {
		return nil, ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(dataType)
	if err != nil {
		return nil, err
	}
	// sort
	opts := options.FindOne()
	if sort != nil {
		opts.SetSort(sort)
	}
	// fetch
	res := col.FindOne(databaseContext(), filter, opts)
	if err := res.Err(); err != nil {
		return nil, err
	}
	// read
	data := getEmptyStruct(dataType)
	if err := res.Decode(data); err != nil {
		return nil, err
	}
	return data, nil
}

func databaseCount(dataType interface{}, filter interface{}) (int, error) {
	// missing params
	if dataType == nil || filter == nil {
		return 0, ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(dataType)
	if err != nil {
		return 0, err
	}
	// do count
	count, err := col.CountDocuments(databaseContext(), filter)
	return int(count), err
}
