import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-simple-puzzle',
  templateUrl: './simple-puzzle.component.html',
  styleUrls: ['./simple-puzzle.component.scss']
})
export class SimplePuzzleComponent implements OnInit {
  size = 5; // changeable via code if needed
  tiles: number[] = [];
  moveCount = 0;
  startTime: number | null = null;
  elapsedMs = 0;
  timerId: any = null;

  ngOnInit(): void {
    this.reset();
  }

  get dimensionStyle() {
    return {
      'grid-template-columns': `repeat(${this.size}, 1fr)`,
      'grid-template-rows': `repeat(${this.size}, 1fr)`
    } as const;
  }

  reset(): void {
    // create ordered tiles with a 0 as empty at the end
    this.tiles = Array.from({ length: this.size * this.size - 1 }, (_, i) => i + 1);
    this.tiles.push(0);
    this.shuffleSolvable();
    this.moveCount = 0;
    this.stopTimer();
    this.elapsedMs = 0;
    this.startTime = null;
  }

  shuffleSolvable(): void {
    const n = this.size * this.size;
    do {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
      }
    } while (!this.isSolvable(this.tiles) || this.isSolved());
  }

  isSolvable(arr: number[]): boolean {
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
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  move(index: number): void {
    if (this.tiles[index] === 0) return;
    if (!this.canMove(index)) return;
    if (this.startTime === null) this.startTimer();
    const empty = this.emptyIndex;
    [this.tiles[index], this.tiles[empty]] = [this.tiles[empty], this.tiles[index]];
    this.moveCount++;
    if (this.isSolved()) {
      this.stopTimer();
    }
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
    }, 100);
  }

  stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
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
}
