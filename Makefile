go:
	node_modules/rollup/bin/rollup -c
	echo sup | nc -G 1 -w 2 localhost 9484

hack:
	node_modules/rollup/bin/rollup -c
	node hack.js & fsevent_watch -F *.js | xargs -n1 -t -I{} make go


# http://mrale.ph/irhydra/2/#
V8_FLAGS += --trace-hydrogen
V8_FLAGS += --trace-phase=Z
V8_FLAGS += --trace-deopt
V8_FLAGS += --code-comments
V8_FLAGS += --hydrogen-track-positions
V8_FLAGS += --redirect-code-traces
V8_FLAGS += --redirect-code-traces-to=code.asm
#V8_FLAGS += --print-opt-code

runtest: test
	NODE_PATH=test node $(V8_FLAGS) test/sobel.js

runeasy: test
	NODE_PATH=test node --trace-opt --trace-deopt test/sobel.js


test: test/convolve.js

test/convolve.js: convolve.js
	node_modules/rollup/bin/rollup -i $< -f umd -n convolve -o $@

.PHONY: go
