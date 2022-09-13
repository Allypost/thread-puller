package fetcher

import (
	"encoding"
)

type Encodable interface {
	encoding.BinaryMarshaler
}

type Fetcher[T Encodable, TS Encodable] interface {
	RefreshCached(parts ...string) (TS, error)
	Fetch(parts ...string) (TS, error)
	FetchOne(parts ...string) (*T, error)
}
