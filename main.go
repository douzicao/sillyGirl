package main

import "github.com/douzicao/sillyGirl/core"

func main() {
	go core.RunServer()
	select {}
}
