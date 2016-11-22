go:
	node_modules/rollup/bin/rollup -c
	echo sup | nc -G 1 -w 2 localhost 9484

hack:
	node_modules/rollup/bin/rollup -c
	node hack.js & fsevent_watch -F *.js | xargs -n1 -t -I{} make go

.PHONY: go
