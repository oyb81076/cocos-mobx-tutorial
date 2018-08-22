import { observer, render } from "./observer";
import { store } from "./store";

const { ccclass } = cc._decorator;

@ccclass
@observer
export default class Star extends cc.Component {
    @render renderActive() {
        this.node.active = store.playing
    }
    @render render() {
        this.node.position = cc.p(store.starX, store.starY)
    }
}
