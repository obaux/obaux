# The press layer (a99, D-602)

`press-light.webm` and `press-dark.webm`: left is today, right is the proposal; a row (Language), a tile (Returned), then a button (Search programs), each held about a second. `pressed-light.png` and `pressed-dark.png`: the held frame, top row today, bottom row the proposal: a row, a tile, a button.

Today a row does nothing when pressed; the tile and button get only Astryx's grey overlay.

The proposal (numbers in D-602): a row darkens (7% black, 10% white in dark; 60ms in, 200ms out); a card, tile or button presses in to 0.97 (90ms in, 220ms out, soft curve) and a card also takes the shade; with reduced motion the shade stays and the scale goes.
