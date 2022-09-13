package main

import (
	"fmt"
	"log"

	"github.com/Allypost/thread-puller/app"
	"github.com/Allypost/thread-puller/app/src/fourChan/fetcher"
)

func main() {
	err := app.Init()
	if err != nil {
		panic(err)
	}

	boards, err := fetcher.BoardFetcher().Fetch()

	if err != nil {
		panic(err)
	}

	for _, board := range boards {
		threads, err := fetcher.ThreadFetcher().Fetch(board.Board)
		if err != nil {
			log.Println(err)
			continue
		}

		for _, thread := range threads {
			if thread.Body.Content == "" {
				fmt.Printf("%s/%s:\t%s\n", thread.Board, thread.Id, thread.Body.Title)
			}
		}
	}
}
