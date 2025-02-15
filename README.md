Second experiment on using RooCode with local Ollama for code generation.

First experiment was a moderate success, where a single detailed prompt generated a tetris clone. This experiment however, was far less succesful.
Detailed prompt did not generate a clone of Dr Mario. RooCode did try to split this into multiple tasks (so effectivly multiple prompts), but it was apparent
that each successive task wan't progressing the project further. I got around this by coming up with the tasks myself. I would write:

> Add a standalone function to file script.js that does X. Takes A and B as input and returns C.

This would yeld some results and quickly produce a function that I need. I specifically had to write "add a standalone function", otherwise the AI would
rewrite half of the file and delete valulable code. Those functions were a good starting point, but still needed to be refined.
I also trid to goad the AI into doing what I want by including classes, but it was a hit or miss situation. When my single JS file reached 160 lines of
code, the response started causing problems for RooCline. I think Roo expects code to be in a diff format, but when faced with a 160 line file,
there were errors in the diff. From that point I was coding mostly br myself (I also borrowed a tine bit from the tetris peoject).

Ultimately, the AI helped me with 25% of the app, but due to many refinements that I had to make, maybe only 10% of the final code can be attributed to
the AI. The AI struggled with the concept of tile having multiple properties. Maybe making a Tetris clone a very common problem and the LLM
was fed many such projects while few Dr Mario clone projects. Maybe it was the added complexity of game logic.

I still haven't tried to use a different model from qwen2.5-coder-cline, I havent properly tested architect mode and worked mostly with a single JS file.
Maybe the approach from this project could still be useful with many small files and perhaps architect mode is better at preparing subtasks.
