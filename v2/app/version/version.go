package version

import (
	"fmt"
	"time"
)

const TimeFormat = "2006-01-02T15:04:05-0700"

// Variable set at compile time
var (
	buildTimestamp = TimeFormat
	environment    = "development"
)

var (
	initialTime              = time.Now()
	parsedTime    *time.Time = nil
	isDevelopment            = environment == "development"
)

func BuildTime() *time.Time {
	if parsedTime != nil {
		return parsedTime
	}

	if buildTimestamp == TimeFormat {
		parsedTime = &initialTime
		return parsedTime
	}

	t, err := time.Parse(TimeFormat, buildTimestamp)

	if err == nil {
		localTime := t.Local()
		parsedTime = &localTime
	} else {
		parsedTime = &initialTime
	}

	return parsedTime
}

func Environment() string {
	return environment
}

func IsDevelopment() bool {
	return isDevelopment
}

func BuildVersion() string {
	return fmt.Sprintf(
		"(%s) [%s]",
		BuildTime().Format(TimeFormat),
		Environment(),
	)
}
