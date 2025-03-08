/**
 * nodejs heap, classic array implementation
 *
 * Items are stored in a balanced binary tree packed into an array where
 * node is at [i], left child is at [2*i], right at [2*i+1].  Root is at [1].
 *
 * Copyright (C) 2014-2021 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

function isBeforeDefault(a: any, b: any) {
  return a < b;
}

export default function Heap(opts) {
  if (!(this instanceof Heap)) return new Heap(opts);

  if (typeof opts === 'function') opts = { compar: opts };

  // copy out known options to not bind to caller object
  this.options = !opts
    ? {}
    : {
        compar: opts.compar,
        comparBefore: opts.comparBefore,
        freeSpace: opts.freeSpace,
        size: opts.size,
      };
  opts = this.options;

  const self = this;
  this._isBefore = opts.compar ? (a, b) => opts.compar(a, b) < 0 : opts.comparBefore || isBeforeDefault;
  this._sortBefore =
    opts.compar ||
    function (a, b) {
      return self._isBefore(a, b) ? -1 : 1;
    };
  this._freeSpace = opts.freeSpace ? this._trimArraySize : false;
  this._list = new Array(opts.size || 20);
  this.length = 0;
}

Heap.prototype._list = null;
Heap.prototype._compar = null;
Heap.prototype._isBefore = null;
Heap.prototype._freeSpace = null;
Heap.prototype._sortBefore = null;
Heap.prototype.length = 0;

/*
 * insert new item at end, and bubble up
 */
Heap.prototype.insert = function Heap_insert(item) {
  const idx = ++this.length;
  return this._bubbleup(idx, item);
};

Heap.prototype._bubbleup = function _bubbleup(idx, item) {
  const list = this._list;
  list[idx] = item;
  if (idx <= 1) return;
  do {
    const pp = idx >>> 1;
    if (this._isBefore(item, list[pp])) list[idx] = list[pp];
    else break;
    idx = pp;
  } while (idx > 1);
  list[idx] = item;
};

Heap.prototype.push = Heap.prototype.insert;
Heap.prototype.enqueue = Heap.prototype.insert;

Heap.prototype.peek = function Heap_peek() {
  return this.length > 0 ? this._list[1] : undefined;
};

Heap.prototype.size = function Heap_size() {
  return this.length;
};

/*
 * return the root, and bubble down last item from top root position
 * when bubbling down, r: root idx, c: child sub-tree root idx, cv: child root value
 * Note that the child at (c == this.length) does not have to be tested in the loop,
 * since its value is the one being bubbled down, so can loop `while (c < len)`.
 */
Heap.prototype.remove = function Heap_remove() {
  const len = this.length;
  if (len < 1) return undefined;
  return this._bubbledown(1, len);
};

Heap.prototype._bubbledown = function _bubbledown(r, len) {
  const list = this._list,
    ret = list[r],
    itm = list[len];
  let c = 0;

  while ((c = r << 1) < len) {
    let cv = list[c],
      cv1 = list[c + 1];
    if (this._isBefore(cv1, cv)) {
      c++;
      cv = cv1;
    }
    if (!this._isBefore(cv, itm)) break;
    list[r] = cv;
    r = c;
  }
  list[r] = itm;
  list[len] = 0;
  this.length = --len;
  if (this._freeSpace) this._freeSpace(this._list, this.length);

  return ret;
};

Heap.prototype.pop = Heap.prototype.remove;
Heap.prototype.dequeue = Heap.prototype.remove;

Heap.prototype.copy = function copy() {
  const ret = new Heap(this.options);
  for (let i = 1; i <= this.length; i++) ret._list[i] = this._list[i];
  ret.length = this.length;
  return ret;
};

// sort the contents of the storage array
// Trim the array for the sort, ensure first item is smallest, sort.
// Note that sorted order is valid heap format.
// Truncating the list is faster than copy-out/copy-in.
// node-v11 and up are 5x faster to sort 1k numbers than v10.
Heap.prototype.sort = function sort() {
  if (this.length < 3) return;
  this._list.splice(this.length + 1);
  this._list[0] = this._list[1];
  this._list.sort(this._sortBefore);
  this._list[0] = 0;
};

/*
 * Free unused storage slots in the _list.
 * The default is to unconditionally gc, use the options to omit when not useful.
 */
Heap.prototype.gc = function Heap_gc(options) {
  if (!options) options = {};

  let minListLength = options.minLength; // smallest list that will be gc-d
  if (minListLength === undefined) minListLength = 0;

  let minListFull = options.minFull; // list utilization below which to gc
  if (minListFull === undefined) minListFull = 1.0;

  if (this._list.length >= minListLength && this.length < this._list.length * minListFull) {
    // gc reallocates the array to free the unused storage slots at the end
    // use splice to actually free memory; 7% slower than setting .length
    // note: list.slice makes the array slower to insert to??  splice is better
    this._list.splice(this.length + 1, this._list.length);
  }
};

Heap.prototype._trimArraySize = function Heap__trimArraySize(list, len) {
  if (len > 10000 && list.length > 4 * len) {
    // use slice to actually free memory; 7% slower than setting .length
    // note: list.slice makes the array slower to insert to?? splice is better
    list.splice(len + 1, list.length);
  }
};

function toStruct(o) {
  return (toStruct.prototype = o);
}

// optimize access
Heap.prototype = toStruct(Heap.prototype);
