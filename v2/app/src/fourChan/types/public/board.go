package public

import (
	"github.com/goccy/go-json"
)

type Board struct {
	Title       string `json:"title"`
	Board       string `json:"board"`
	Link        string `json:"link"`
	Description string `json:"description"`
	Nsfw        bool   `json:"nsfw"`
}

func (b Board) MarshalBinary() (data []byte, err error) {
	return json.Marshal(b)
}

func (b *Board) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, b)
}

type Boards []Board

func (b Boards) MarshalBinary() (data []byte, err error) {
	return json.Marshal(b)
}

func (b *Boards) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, b)
}
