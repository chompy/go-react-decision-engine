package main

import (
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"math/big"
	"strings"
	"time"

	"github.com/martinlindhe/base36"
)

type DatabaseID [5]byte

func GenerateDatabaseId() DatabaseID {
	out := [5]byte{0, 0, 0, 0, 0}
	timestamp := time.Now()
	binary.BigEndian.PutUint32(out[1:5], uint32(timestamp.Unix()))
	// TODO might be better to have an incrementing rand digit
	randV, err := rand.Int(rand.Reader, big.NewInt(255))
	if err == nil {
		out[0] = uint8(randV.Uint64())
	}
	return DatabaseID(out)
}

func DatabaseIDFromString(id string) DatabaseID {
	data := base36.DecodeToBytes(strings.TrimSpace(strings.ToUpper(id)))
	out := DatabaseID{}
	if len(data) >= len(out) {
		for i := range out {
			out[i] = data[i]
		}
	}
	return out
}

func (id DatabaseID) IsEmpty() bool {
	for i := range id {
		if id[i] != 0 {
			return false
		}
	}
	return true
}

func (id DatabaseID) String() string {
	if id.IsEmpty() {
		return ""
	}
	return strings.ToLower(base36.EncodeBytes(id[:]))
}

func (id DatabaseID) MarshalJSON() ([]byte, error) {
	return json.Marshal(id.String())
}

func (id *DatabaseID) UnmarshalJSON(data []byte) error {
	idString := ""
	if err := json.Unmarshal(data, &idString); err != nil {
		return err
	}
	*id = DatabaseIDFromString(idString)
	return nil
}
