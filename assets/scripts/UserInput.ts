/**
 * 绑定用户输入 (键盘/鼠标)
 * 绑定用键盘事件和鼠标事件点击事件
 */

import { store } from "./store";
import { render, observer } from "./observer";
enum AccSide { NONE, LEFT, RIGHT }
const { NONE, LEFT, RIGHT } = AccSide


const { ccclass } = cc._decorator;
@ccclass
@observer
export default class UserInput extends cc.Component {
    // use this for initialization
    onLoad() {
        // 初始化键盘输入监听
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.handleKeyDown, this)
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.handleKeyUp, this)
        // 初始化点击
        this.node.on(cc.Node.EventType.TOUCH_START, this.handleTouchBegan, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this.handleTouchEnd, this)
    }
    accSide: AccSide = NONE

    @render
    protected renderEnabled() {
        this.enabled = store.playing
    }

    private handleKeyDown({ keyCode }: cc.Event.EventCustom) {
        switch (keyCode) {
            case cc.KEY.a:
            case cc.KEY.left:
                this.accSide = LEFT
                break;
            case cc.KEY.d:
            case cc.KEY.right:
                this.accSide = RIGHT
                break;
        }
    }

    private handleKeyUp({ keyCode }: cc.Event.EventCustom) {
        switch (keyCode) {
            case cc.KEY.a:
            case cc.KEY.left:
            case cc.KEY.d:
            case cc.KEY.right:
                this.accSide = NONE
        }
    }

    private handleTouchBegan(e: cc.Event.EventTouch) {
        var touchLoc = e.touch.getLocation();
        if (touchLoc.x >= cc.winSize.width / 2) {
            this.accSide = RIGHT
        } else {
            this.accSide = LEFT
        }
    }

    private handleTouchEnd(e: cc.Event.EventTouch) {
        this.accSide = NONE
    }
    
    protected update(dt: number) {
        if (this.accSide === LEFT) {
            store.xSpeed -= store.accel * dt;
        } else if (this.accSide === RIGHT) {
            store.xSpeed += store.accel * dt;
        }
        // 限制主角的速度不能超过最大值
        if (Math.abs(store.xSpeed) > store.maxMoveSpeed) {
            // if speed reach limit, use max speed with current direction
            store.xSpeed = store.maxMoveSpeed * store.xSpeed / Math.abs(store.xSpeed);
        }
    }
}