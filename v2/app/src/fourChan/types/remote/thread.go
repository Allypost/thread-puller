package remote

type Catalog []catalogEntry

type catalogEntry struct {
	Page    int    `json:"page"`
	Threads []Post `json:"threads"`
}
