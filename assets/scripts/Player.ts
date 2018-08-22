import { store } from "./store";
import { render, observer } from "./observer";

const { ccclass, property } = cc._decorator;

@ccclass
@observer
export default class Player extends cc.Component {
    @property(cc.AudioClip)
    private jumpAudio = ''

    // 调用声音引擎播放声音
    private playJumpSound () {
        cc.audioEngine.play(this.jumpAudio, false, 1);
    }

    /**
     * 渲染player移动
     */
    @render 
    protected render() {
        if (this.enabled = store.playing) {
            this.node.position = cc.p(0, store.groundY)
            this.runJumpAction()
        } else {
            this.node.stopAllActions()
        }
    }

    /**
     * 执行跳跃动画
     */
    private runJumpAction(): void {
        // 跳跃上升
        var jumpUp = cc.moveBy(store.jumpDuration, cc.p(0, store.jumpHeight)).easing(cc.easeCubicActionOut());
        // 下落
        var jumpDown = cc.moveBy(store.jumpDuration, cc.p(0, -store.jumpHeight)).easing(cc.easeCubicActionIn());
        // 形变
        var squash = cc.scaleTo(store.squashDuration, 1, 0.6);
        var stretch = cc.scaleTo(store.squashDuration, 1, 1.2);
        var scaleBack = cc.scaleTo(store.squashDuration, 1, 1);
        // 添加一个回调函数，用于在动作结束时调用我们定义的其他方法
        var callback = cc.callFunc(this.playJumpSound, this);
        // 不断重复，而且每次完成落地动作后调用回调来播放声音
        this.node.runAction(cc.repeatForever(cc.sequence(squash, stretch, jumpUp, scaleBack, jumpDown, callback)))
    }

    // 获取到star的距离
    private get playerDistance(): number {
        const { x, y, height } = this.node
        const playerPos = cc.p(x, y + height / 2);
        // 根据两点位置计算两点之间距离
        const dist = cc.pDistance(store.currStarPos, playerPos);
        return dist;
    }
    // called every frame
    update(dt: number) {
        // 根据当前速度更新主角的位置
        this.node.x += store.xSpeed * dt;
        // limit player position inside screen
        if (this.node.x > store.width / 2) {
            // 如果跑出了屏幕了, 就把它弄到屏幕左边
            this.node.x = -store.width / 2
        } else if (this.node.x < -store.width / 2) {
            // 如果跑出屏幕左边了, 就把它弄到屏幕右边
            this.node.x = store.width / 2;
        }
        if (this.playerDistance < store.pickRadius) {
            store.addScore()
        }
    }
}
