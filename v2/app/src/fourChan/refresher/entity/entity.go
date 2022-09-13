package entity

import (
	"fmt"
	"strings"

	"github.com/Allypost/thread-puller/app/src/fourChan/refresher/handlerId"
)

const RedisEntitySeparator = "$"

type Entity struct {
	HandlerId handlerId.HandlerId `json:"handlerId"`
	EntityId  string              `json:"entityId"`
}

func New(handlerId handlerId.HandlerId, entityId string) Entity {
	return Entity{
		HandlerId: handlerId,
		EntityId:  entityId,
	}
}

func Decode(data string) (*Entity, error) {
	parts := strings.Split(data, RedisEntitySeparator)

	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid entity: %s", data)
	}

	return &Entity{
		HandlerId: handlerId.HandlerId(parts[0]),
		EntityId:  strings.Join(parts[1:], RedisEntitySeparator),
	}, nil
}

func (e Entity) String() string {
	return fmt.Sprintf(
		"%s%s%s",
		e.HandlerId,
		RedisEntitySeparator,
		e.EntityId,
	)
}
