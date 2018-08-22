const { ccclass } = cc._decorator;

@ccclass
export default class ScoreAnim extends cc.Component {
    onHide?: Function
    init({ onHide }: { onHide: () => void }) {
        this.onHide = onHide
    }

    hideFX() {
        this.onHide && this.onHide()
    }
}