import ScoreFX from "./ScoreFX";
import { render, observer, reactor, react } from "./observer";
import { store } from "./store";

const { ccclass, property } = cc._decorator;

@ccclass
@observer
export default class Game extends cc.Component {
    @property(cc.Prefab)
    private starPrefab: cc.Prefab = null as any

    @property(cc.Prefab)
    private scoreFXPrefab: cc.Prefab = null as any

    // 地面节点，用于确定星星生成的高度
    @property(cc.Node)
    private ground: cc.Node = null as any

    // score label 的引用
    @property(cc.Label)
    private scoreDisplay: cc.Label = null as any

    // 得分音效资源
    @property(cc.AudioClip)
    private scoreAudio: string = ''

    @property(cc.Node)
    private btnNode: cc.Node = null as any

    @property(cc.Node)
    private gameOverNode: cc.Node = null as any

    @property(cc.Label)
    private controlHintLabel: cc.Label = null as any

    @property({ multiline: true })
    private keyboardHint = ''

    @property({ multiline: true })
    private touchHint = ''

    private scorePool = new cc.NodePool('ScoreFX')

    onLoad() {
        store.init(this.node, this.ground)
        this.node.addChild(cc.instantiate(this.starPrefab))
        var hintText = cc.sys.isMobile ? this.touchHint : this.keyboardHint;
        this.controlHintLabel.string = hintText;
        this.btnNode.on(cc.Node.EventType.TOUCH_END, this.onClickBtn)
    }

    onClickBtn(){
        store.setState(store.PLAYING)
    }

    /** 
     * 根据游戏阶段修改按钮的显示隐藏 以及 enabled
     */
    @render
    protected renderState() {
        switch (store.state) {
            case store.NONE:
                this.btnNode.active = true
                this.gameOverNode.active = false
                this.enabled = false
                break
            case store.PLAYING:
                this.btnNode.active = false
                this.gameOverNode.active = false
                this.enabled = true
                break
            case store.OVER:
                this.btnNode.active = true
                this.gameOverNode.active = true
                this.enabled = false
                break
        }
    }

    /**
     * 当游戏阶段变为playing的时候, 初始化一下数据
     */
    @reactor
    protected playingReactor() {
        return react(() => store.state === store.PLAYING, (p) => {
            if (p) {
                store.score = 0
                store.xSpeed = 0
                store.updateStarPos()
            }
        })
    }

    /**
     * 当 store.score 发生变化的时候, 执行一些动画效果
     */
    @render
    protected renderScore() {
        if (store.score) {//当 score > 0 的时候执行动画
            this.runOnGainScore()
        }
        this.scoreDisplay.string = `Score: ${store.score}`
    }

    /** 得分的时候的动画 */
    private runOnGainScore() {
        const fx = this.spawnScoreFX();
        this.node.addChild(fx.node)
        fx.play()
        cc.audioEngine.play(this.scoreAudio, false, 1);
    }

    /** 从数据池获取一个scoreFx */
    private spawnScoreFX(): ScoreFX {
        if (this.scorePool.size() > 0) {
            return this.scorePool.get().getComponent(ScoreFX)
        } else {
            const fx = cc.instantiate(this.scoreFXPrefab).getComponent(ScoreFX);
            fx.init({ onHide: () => this.scorePool.put(fx.node) })
            return fx;
        }
    }

    protected update(dt: number) {
        if (store.addTimerAndReturnIsTimeout(dt)) {
            store.setState(store.OVER)
        }
    }
}
