package requestTimer

import (
	"fmt"
	"strings"
	"time"
)

type measurement struct {
	startTime time.Time
	endTime   time.Time
}

type RequestTimer struct {
	measurements map[string]*measurement
}

func New() *RequestTimer {
	return &RequestTimer{
		measurements: make(map[string]*measurement),
	}
}

func (r *RequestTimer) Start(name string) {
	ts := time.Now()

	r.measurements[name] = &measurement{
		startTime: ts,
	}
}

func (r *RequestTimer) End(name string) {
	ts := time.Now()

	r.measurements[name].endTime = ts
}

func (r *RequestTimer) String() string {
	items := make([]string, 0, len(r.measurements))
	for name, measurement := range r.measurements {
		if measurement.endTime.IsZero() {
			measurement.endTime = time.Now()
		}

		duration := float64(measurement.endTime.Sub(measurement.startTime).Microseconds()) / 1e3

		items = append(
			items,
			fmt.Sprintf(
				"%s;dur=%.3f",
				name,
				duration,
			),
		)
	}

	return strings.Join(items, ", ")
}
