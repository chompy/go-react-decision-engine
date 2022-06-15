package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func databaseFilter(data interface{}) interface{} {
	switch d := data.(type) {
	case *NodeTop:
		{
			return bson.M{"parent": d.Parent, "uid": d.UID}
		}
	case *NodeVersion:
		{
			return bson.M{"version": d.Version, "uid": d.UID}
		}
	case *UserData:
		{
			return bson.M{"key": d.Key, "root_uid": d.RootUID, "root_version": d.RootVersion}
		}
	case *User:
		{
			return bson.M{"uid": d.UID}
		}
	case *Team:
		{
			return bson.M{"uid": d.UID}
		}
	}
	return nil
}

func databaseStore(datas []interface{}) error {
	// missing param
	if datas == nil {
		return ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(datas[0])
	if err != nil {
		return err
	}
	// create write models
	models := make([]mongo.WriteModel, 0)
	for _, data := range datas {
		doc, err := toBSONDoc(data)
		if err != nil {
			return err
		}
		model := mongo.NewUpdateOneModel()
		model.SetUpsert(true)
		model.SetFilter(databaseFilter(data))
		model.SetUpdate(bson.D{{Key: "$set", Value: doc}})
		models = append(models, model)
	}
	// write
	if _, err := col.BulkWrite(databaseContext(), models); err != nil {
		return err
	}
	return nil
}

func databaseStoreOne(data interface{}) error {
	// missing param
	if data == nil {
		return ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(data)
	if err != nil {
		return err
	}
	// options
	opts := options.Update()
	opts.SetUpsert(true)
	// make doc
	doc, err := toBSONDoc(data)
	if err != nil {
		return err
	}
	// update
	if _, err := col.UpdateOne(databaseContext(), databaseFilter(data), bson.M{"$set": doc}, opts); err != nil {
		return err
	}
	return nil
}

func databaseDelete(dataType interface{}, filter interface{}) error {
	// missing param
	if dataType == nil || filter == nil {
		return ErrNoData
	}
	// get collection
	col, err := databaseCollectionFromData(dataType)
	if err != nil {
		return err
	}
	// delete
	if _, err := col.DeleteMany(databaseContext(), filter); err != nil {
		return err
	}
	return nil
}
