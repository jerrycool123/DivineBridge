import { store } from './store.js';

export class Core {
  public get context() {
    return store;
  }
}
