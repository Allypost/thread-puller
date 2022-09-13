package logger

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/Allypost/thread-puller/app/version"
)

type Logger struct {
	*log.Logger

	name string
}

func For(name string) *Logger {
	logger_ := log.New(
		os.Stdout,
		"",
		log.LstdFlags|
			log.LUTC|
			log.Lmicroseconds,
	)

	return &Logger{
		Logger: logger_,
		name:   strings.ToUpper(name),
	}
}

func (l *Logger) Printf(format string, args ...interface{}) {
	args = append(
		[]interface{}{
			l.name,
		},
		args...,
	)

	l.Logger.Printf("|%s>\t"+format, args...)
}

func (l *Logger) Println(args ...interface{}) {
	args = append(
		[]interface{}{
			fmt.Sprintf("|%s>", l.name),
			"\t",
		},
		args...,
	)

	l.Logger.Println(args...)
}

func (l *Logger) Debugf(format string, args ...interface{}) {
	if !version.IsDevelopment() {
		return
	}

	l.Printf(format, args...)
}
