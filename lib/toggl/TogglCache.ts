// Docs for sorted btree: https://www.npmjs.com/package/sorted-btree
import type { Detailed } from 'lib/model/Report';
import BTree, { ISortedMap } from 'sorted-btree';

/** UNIX-time representation of a date */
type date = number;

export default class TogglCache {
	private entries: ISortedMap<date, Detailed[]> = new BTree();
}
