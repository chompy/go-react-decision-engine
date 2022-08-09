package main

import (
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func databaseFilter(data interface{}) interface{} {
	switch d := data.(type) {
	case *TreeRoot:
		{
			return bson.M{"_id": d.ID}
		}
	case *TreeVersion:
		{
			return bson.M{"version": d.Version, "root_id": d.RootID}
		}
	case *FormSubmission:
		{
			return bson.M{"_id": d.ID}
		}
	case *User:
		{
			return bson.M{"_id": d.ID}
		}
	case *Team:
		{
			return bson.M{"_id": d.ID}
		}
	case *RuleTemplate:
		{
			return bson.M{"_id": d.ID}
		}
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
