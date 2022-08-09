package main

import (
	"errors"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func databaseReadResult(dataType interface{}, rawStruct interface{}) (interface{}, error) {
	rawData, err := bson.Marshal(rawStruct)
	if err != nil {
		return nil, err
	}
	data := getEmptyStruct(dataType)
	if err := bson.Unmarshal(rawData, data); err != nil {
		return nil, err
	}
	return data, nil
}

func databaseReadResults(dataType interface{}, cur *mongo.Cursor) ([]interface{}, error) {
	out := make([]interface{}, 0)
	for cur.Next(databaseContext()) {
		data, err := databaseReadResult(dataType, cur.Current)
		if err != nil {
			return nil, err
		}
		out = append(out, data)
	}
	return out, nil
}

func databaseListAll(dataType interface{}, filter interface{}, sort interface{}, projection interface{}) ([]interface{}, error) {
	// missing params
	if dataType == nil || filter == nil {
		return nil, ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(dataType)
	if err != nil {
		return nil, err
	}
	// set fetch options
	opts := options.Find()
	// sort
	if sort == nil {
		sort = bson.D{{Key: "modified", Value: -1}}
	}
	opts.SetSort(sort)
	// projection
	if projection != nil {
		opts.SetProjection(projection)
	}
	// do fetch
	cur, err := col.Find(databaseContext(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(databaseContext())
	// convert back to go structs
	res, err := databaseReadResults(dataType, cur)
	return res, err
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

func databaseListAggregate(dataType interface{}, pipeline mongo.Pipeline, offset int) ([]interface{}, int, error) {
	// missing params
	if dataType == nil || pipeline == nil {
		return nil, 0, ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(dataType)
	if err != nil {
		return nil, 0, err
	}
	// build facets, set limit and offset
	facet := bson.D{
		bson.E{
			Key: "$facet",
			Value: bson.M{
				"count": bson.A{
					bson.M{"$count": "total"},
				},
				"documents": bson.A{
					bson.M{"$skip": offset},
					bson.M{"$limit": dbFetchLimit},
				},
			},
		},
	}
	pipeline = append(pipeline, facet)
	// perform aggregate query
	cur, err := col.Aggregate(databaseContext(), pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cur.Close(databaseContext())
	// decode results
	if !cur.Next(databaseContext()) {
		return nil, 0, ErrNoData
	}
	res := map[string]interface{}{}
	if err := cur.Decode(&res); err != nil {
		return nil, 0, err
	}
	totalCount := 0
	if len(res["count"].(bson.A)) > 0 {
		totalCount = int(res["count"].(bson.A)[0].(map[string]interface{})["total"].(int32))
	}
	out := make([]interface{}, 0)
	if totalCount > 0 {
		docs := res["documents"].(bson.A)
		for _, doc := range docs {
			data, err := databaseReadResult(dataType, doc)
			if err != nil {
				return nil, 0, err
			}
			out = append(out, data)
		}
	}
	return out, totalCount, nil
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
	if err != nil && !errors.Is(err, mongo.ErrNilDocument) {
		return 0, err
	}
	return int(count), nil
}
