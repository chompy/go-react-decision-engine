package main

import (
	"log"

	"go.mongodb.org/mongo-driver/bson"
)

func createTestObjects() {
	// check if user already exists
	res, err := databaseCount(User{}, bson.M{})
	if err != nil {
		panic(err)
	}
	if res > 0 {
		return
	}
	dummyUser := User{Permission: PermAdmin}
	// create team
	testTeam := Team{
		Name: "Test Team",
	}
	if err := testTeam.Store(&dummyUser); err != nil {
		panic(err)
	}
	// create user
	hashedPassword, err := HashPassword("test1234")
	if err != nil {
		panic(err)
	}
	adminTestUser := User{
		Email:      "admin@example.com",
		Password:   hashedPassword,
		Permission: PermAdmin,
		Team:       testTeam.ID,
	}
	dummyUser.Team = testTeam.ID
	if err := adminTestUser.Store(&dummyUser); err != nil {
		panic(err)
	}
	log.Println("===== SAMPLE USER CREATED ====")
	log.Printf("TEST TEAM: %s\n", testTeam.ID.String())
	log.Printf("TEST USER: %s / %s", adminTestUser.Email, "test1234")
	log.Println("==============================")
}

func main() {
	// load config
	log.Println("Load config.")
	config, err := ConfigLoad()
	if err != nil {
		panic(err)
	}
	// open database
	log.Println("Open database.")
	if err := databaseOpen(&config); err != nil {
		panic(err)
	}
	defer databaseClose()
	// TODO this is just for testing, not for prod
	createTestObjects()
	log.Println("Starting backend.")
	// start http
	if err := HTTPStart(&config); err != nil {
		panic(err)
	}
}
