import ScoreAnim from "./ScoreAnim";
import { store } from "./store";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ScoreFx extends cc.Component {
    @property(cc.Animation)
    anim: cc.Animation = null as any
    /** 销毁的方法 */
    init(props: { onHide: () => void }) {
        this.anim.getComponent(ScoreAnim).init(props);
    }

    play() {
        this.node.setPosition(store.prevStarPos)
        this.anim.play('score_pop');
    }
}
