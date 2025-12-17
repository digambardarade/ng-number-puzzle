import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-puzzle',
  templateUrl: './puzzle.component.html',
  styleUrls: ['./puzzle.component.scss']
})
export class PuzzleComponent implements OnInit {
  // Toggle all localStorage usage. Set to true to enable persistence/theme/best saves.
  private readonly USE_LOCAL_STORAGE = false;
  size = 3;
  theme: 'wood' | 'green' | 'blue' = 'wood';
  tiles: number[] = [];
  moveCount = 0;
  startTime: number | null = null;
  elapsedMs = 0;
  timerId: any = null;
  paused = false;
  stopped = false;
  showBanner = false; // show congrats/end banner only after solve or explicit stop
  lastMovedIndex: number | null = null;
  bestTimeMs: number | null = null;
  bestMoves: number | null = null;
  newBest = false;

  ngOnInit(): void {
    this.loadTheme();
    // Try to load existing game; if none, start ordered without shuffling
    if (!this.loadGameState()) {
      this.reset(false);
    }
    // Never show banner on initial load, even if solved/stopped state was restored
    this.showBanner = false;
    this.loadBest();
  }

  get dimensionStyle() {
    return {
      'grid-template-columns': `repeat(${this.size}, 1fr)`,
      'grid-template-rows': `repeat(${this.size}, 1fr)`
    };
  }

  reset(shuffle: boolean = true): void {
    this.tiles = Array.from({ length: this.size * this.size - 1 }, (_, i) => i + 1);
    this.tiles.push(0);
    this.moveCount = 0;
    this.stopTimer();
    this.elapsedMs = 0;
    this.startTime = null;
    this.paused = false;
    this.stopped = false;
    this.showBanner = false;
    this.lastMovedIndex = null;
    this.newBest = false;
    if (shuffle) {
      this.shuffleSolvable();
    }
    this.saveGameState();
  }

  shuffleSolvable(): void {
    // Fisher-Yates shuffle until solvable and not already solved
    const n = this.size * this.size;
    do {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
      }
    } while (!this.isSolvable(this.tiles) || this.isSolved());
  }

  isSolvable(arr: number[]): boolean {
    // For odd grid (5x5), puzzle is solvable if inversion count is even
    const flat = arr.filter(v => v !== 0);
    let inversions = 0;
    for (let i = 0; i < flat.length; i++) {
      for (let j = i + 1; j < flat.length; j++) {
        if (flat[i] > flat[j]) inversions++;
      }
    }
    if (this.size % 2 === 1) {
      return inversions % 2 === 0;
    }
    // Even grid general rule: inversions + rowFromBottom(blank) must be odd
    const blankIndex = arr.indexOf(0);
    const blankRowFromBottom = this.size - Math.floor(blankIndex / this.size);
    return (inversions + blankRowFromBottom) % 2 === 1;
  }

  get emptyIndex(): number {
    return this.tiles.indexOf(0);
  }

  canMove(index: number): boolean {
    const empty = this.emptyIndex;
    const r1 = Math.floor(index / this.size);
    const c1 = index % this.size;
    const r2 = Math.floor(empty / this.size);
    const c2 = empty % this.size;
    const manhattan = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    return manhattan === 1;
  }

  move(index: number): void {
    if (this.paused || this.stopped) return;
    if (this.tiles[index] === 0) return;
    if (!this.canMove(index)) return;
    if (this.startTime === null) this.startTimer();
    const empty = this.emptyIndex;
    [this.tiles[index], this.tiles[empty]] = [this.tiles[empty], this.tiles[index]];
    this.moveCount++;
    this.lastMovedIndex = empty; // the tile moved into the empty position
    setTimeout(() => { this.lastMovedIndex = null; }, 180);
    if (this.isSolved()) {
      this.stopTimer();
      this.updateBest();
      this.showBanner = true;
    }
    this.saveGameState();
  }

  isSolved(): boolean {
    for (let i = 0; i < this.tiles.length - 1; i++) {
      if (this.tiles[i] !== i + 1) return false;
    }
    return this.tiles[this.tiles.length - 1] === 0;
  }

  startTimer(): void {
    this.startTime = Date.now();
    this.timerId = setInterval(() => {
      if (this.startTime !== null) {
        this.elapsedMs = Date.now() - this.startTime;
      }
    }, 50);
  }

  stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  pauseTimer(): void {
    this.stopTimer();
    this.startTime = null;
  }

  resumeTimer(): void {
    // Resume from accumulated elapsedMs
    this.startTime = Date.now() - this.elapsedMs;
    if (!this.timerId) {
      this.timerId = setInterval(() => {
        if (this.startTime !== null) {
          this.elapsedMs = Date.now() - this.startTime;
        }
      }, 50);
    }
  }

  togglePause(): void {
    if (this.isSolved() || this.stopped) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseTimer();
    } else {
      this.resumeTimer();
    }
    this.saveGameState();
  }

  stopGame(): void {
    if (this.isSolved() || this.stopped) return;
    this.stopped = true;
    this.pauseTimer();
    this.showBanner = true;
    this.saveGameState();
  }

  get themeClass(): string {
    return `theme-${this.theme}`;
  }

  changeTheme(val: string): void {
    const v = (val || '').toLowerCase();
    if (v === 'wood' || v === 'green' || v === 'blue') {
      this.theme = v as any;
      this.saveTheme();
      this.saveGameState();
    }
  }

  private loadTheme(): void {
    if (!this.USE_LOCAL_STORAGE) return; // localStorage disabled
    try {
      const v = localStorage.getItem('ngp_theme');
      if (v === 'wood' || v === 'green' || v === 'blue') {
        this.theme = v as any;
      }
    } catch {}
  }

  private saveTheme(): void {
    if (!this.USE_LOCAL_STORAGE) return; // localStorage disabled
    try { localStorage.setItem('ngp_theme', this.theme); } catch {}
  }

  changeSize(val: number | string): void {
    const n = Number(val);
    if (![3,4,5].includes(n)) return;
    if (n === this.size) return;
    this.size = n;
    this.reset();
    this.loadBest();
  }

  private bestKey(): string {
    return `ngpuzzle_best_${this.size}`;
  }

  loadBest(): void {
    if (!this.USE_LOCAL_STORAGE) { this.bestTimeMs = null; this.bestMoves = null; return; }
    try {
      const raw = localStorage.getItem(this.bestKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        this.bestTimeMs = typeof parsed.time === 'number' ? parsed.time : null;
        this.bestMoves = typeof parsed.moves === 'number' ? parsed.moves : null;
      } else {
        this.bestTimeMs = null;
        this.bestMoves = null;
      }
    } catch {
      this.bestTimeMs = null;
      this.bestMoves = null;
    }
  }

  updateBest(): void {
    this.newBest = false;
    const currentTime = this.elapsedMs;
    const currentMoves = this.moveCount;
    let improved = false;

    if (this.bestTimeMs === null || currentTime < this.bestTimeMs) {
      this.bestTimeMs = currentTime;
      improved = true;
    }
    if (this.bestMoves === null || currentMoves < this.bestMoves) {
      this.bestMoves = currentMoves;
      improved = true;
    }
    if (improved) {
      this.newBest = true;
      if (this.USE_LOCAL_STORAGE) {
        try {
          localStorage.setItem(this.bestKey(), JSON.stringify({ time: this.bestTimeMs, moves: this.bestMoves }));
        } catch {}
      }
    }
    this.saveGameState();
  }

  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:` +
           `${seconds.toString().padStart(2, '0')}:` +
           `${millis.toString().padStart(3, '0')}`;
  }

  onSelectChange(event: Event): void {
    const el = event.target as HTMLSelectElement | null;
    // Blur to remove focus so it returns to themed (white) text immediately
    if (el && typeof el.blur === 'function') {
      el.blur();
    }
  }

  private stateKey(): string {
    return 'ngp_state';
  }

  private saveGameState(): void {
    if (!this.USE_LOCAL_STORAGE) return; // localStorage disabled
    try {
      const running = this.startTime !== null && !this.paused && !this.stopped && !this.isSolved();
      const state = {
        size: this.size,
        tiles: this.tiles,
        moveCount: this.moveCount,
        elapsedMs: this.elapsedMs,
        paused: this.paused,
        stopped: this.stopped,
        running,
        theme: this.theme,
        ts: Date.now()
      };
      localStorage.setItem(this.stateKey(), JSON.stringify(state));
    } catch {}
  }

  private loadGameState(): boolean {
    if (!this.USE_LOCAL_STORAGE) return false; // localStorage disabled
    try {
      const raw = localStorage.getItem(this.stateKey());
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return false;
      const size = Number(s.size);
      if (![3,4,5].includes(size)) return false;
      const tiles: number[] = Array.isArray(s.tiles) ? s.tiles.slice() : [];
      if (tiles.length !== size * size) return false;

      this.size = size;
      this.tiles = tiles;
      this.moveCount = typeof s.moveCount === 'number' ? s.moveCount : 0;
      this.elapsedMs = typeof s.elapsedMs === 'number' ? s.elapsedMs : 0;
      this.paused = !!s.paused;
      this.stopped = !!s.stopped;
      const theme = (s.theme || '').toLowerCase();
      if (theme === 'wood' || theme === 'green' || theme === 'blue') {
        this.theme = theme as any;
      }
      this.startTime = null;
      if (s.running && !this.paused && !this.stopped && !this.isSolved()) {
        this.resumeTimer();
      }
      return true;
    } catch {
      return false;
    }
  }
}
