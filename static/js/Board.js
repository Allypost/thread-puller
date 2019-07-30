import Vue from 'vue';
import linkify from 'vue-linkify';

import BoardContainer from './src/Board/container';
import { onReady } from './src/util/onReady';

Vue.directive('linkified', linkify);

class Board {
    constructor(rootElement, board = '', threads = []) {
        this.data = { board, threads };

        this.vue =
            this.constructor
                .createVueInstance({ board, threads })
                .$mount(rootElement);
    }

    static createVueInstance({ board, threads }) {
        return new Vue({
            data: { board, threads },
            template: `<board-container :threads="threads" :board="board" />`,
            components: { BoardContainer },
        });
    }
}

onReady(() => {
    const rootElement = document.getElementById('container');

    new Board(rootElement, bootData.board, bootData.threads);
});
