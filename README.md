# 用mobx做状态管理的 小星星游戏 Star Catcher 的 demo
mobx 库介绍 https://cn.mobx.js.org/
项目地址 https://github.com/oyb81076/cocos-mobx-tutorial

## 使用状态后 Game.ts
```
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

```

## 原版 https://github.com/cocos-creator/tutorial-first-game/blob/master/polished_project_ts/assets/scripts/Game.ts
```
import Player from "./Player";
import ScoreFX from "./ScoreFX";
import Star from "./Star";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewScript extends cc.Component {
    // 这个属性引用了星星预制资源
    @property(cc.Prefab)
    starPrefab: cc.Prefab = null;
        
    @property(cc.Prefab)
    scoreFXPrefab: cc.Prefab = null;
            
    // 星星产生后消失时间的随机范围
    @property({
        default: 0
    })
    maxStarDuration: number = 0;
    @property({
        default: 0
    })
    minStarDuration: number = 0;

    // 地面节点，用于确定星星生成的高度
    @property(cc.Node)
    ground: cc.Node = null;
    
    // player 节点，用于获取主角弹跳的高度，和控制主角行动开关
    /**
     * @type {Player}
     */
    @property(Player)
    player: Player = null;

    // score label 的引用
    @property(cc.Label)
    scoreDisplay: cc.Label = null;
    
    // 得分音效资源
    @property(cc.AudioClip)
    scoreAudio: cc.AudioClip = null;
        
    @property(cc.Node)
    btnNode: cc.Node = null;
    
    @property(cc.Node)
    gameOverNode: cc.Node = null;

    @property(cc.Label)
    controlHintLabel: cc.Label = null;

    @property({
        multiline: true
    })
    keyboardHint = '';
    
    @property({
        multiline: true
    })
    touchHint = '';

    groundY = 0;

    // use this for initialization
    onLoad () {
        // 获取地平面的 y 轴坐标
        this.groundY = this.ground.y + this.ground.height/2;

        // store last star's x position
        this.currentStar = null;
        this.currentStarX = 0;

        // 初始化计时器
        this.timer = 0;
        this.starDuration = 0;

        // is showing menu or running game
        this.isRunning = false;

        // initialize control hint
        var hintText = cc.sys.isMobile ? this.touchHint : this.keyboardHint;
        this.controlHintLabel.string = hintText;

        // initialize star and score pool
        this.starPool = new cc.NodePool('Star');
        this.scorePool = new cc.NodePool('ScoreFX');
    }

    onStartGame () {
        // 初始化计分
        this.resetScore();
        // set game state to running
        this.isRunning = true;
        // set button and gameover text out of screen
        this.btnNode.setPositionX(3000);
        this.gameOverNode.active = false;
        // reset player position and move speed
        this.player.startMoveAt(cc.p(0, this.groundY));
        // spawn star
        this.spawnNewStar();
    }

    spawnNewStar () {
        /**
         * @type {cc.Node}
         */
        var newStar = null;
        // 使用给定的模板在场景中生成一个新节点
        if (this.starPool.size() > 0) {
            newStar = this.starPool.get(this); // this will be passed to Star's reuse method
        } else {
            newStar = cc.instantiate(this.starPrefab);
        }
        // 将新增的节点添加到 Canvas 节点下面
        this.node.addChild(newStar);
        // 为星星设置一个随机位置
        newStar.setPosition(this.getNewStarPosition());
        // pass Game instance to star
        newStar.getComponent(Star).init(this);
        // start star timer and store star reference
        this.startTimer();
        this.currentStar = newStar;
    }

    despawnStar (star) {
        this.starPool.put(star);
        this.spawnNewStar();
    }

    startTimer () {
        // get a life duration for next star
        this.starDuration = this.minStarDuration + cc.random0To1() * (this.maxStarDuration - this.minStarDuration);
        this.timer = 0;
    }

    getNewStarPosition () {
        // if there's no star, set a random x pos
        if (!this.currentStar) {
            this.currentStarX = cc.randomMinus1To1() * this.node.width/2;
        }
        var randX = 0;
        // 根据地平面位置和主角跳跃高度，随机得到一个星星的 y 坐标
        var randY = this.groundY + cc.random0To1() * this.player.jumpHeight + 50;
        // 根据屏幕宽度和上一个星星的 x 坐标，随机得到一个新生成星星 x 坐标
        var maxX = this.node.width/2;
        if (this.currentStarX >= 0) {
            randX = -cc.random0To1() * maxX;
        } else {
            randX = cc.random0To1() * maxX;
        }
        this.currentStarX = randX;
        // 返回星星坐标
        return cc.p(randX, randY);
    }

    gainScore (pos) {
        this.score += 1;
        // 更新 scoreDisplay Label 的文字
        this.scoreDisplay.string = 'Score: ' + this.score.toString();
        // 播放特效
        var fx = this.spawnScoreFX();
        this.node.addChild(fx.node);
        fx.node.setPosition(pos);
        fx.play();
        // 播放得分音效
        cc.audioEngine.play(this.scoreAudio, false, 1);
    }

    resetScore () {
        this.score = 0;
        this.scoreDisplay.string = 'Score: ' + this.score.toString();
    }

    spawnScoreFX () {
        var fx;
        if (this.scorePool.size() > 0) {
            fx = this.scorePool.get();
            return fx.getComponent(ScoreFX);
        } else {
            fx = cc.instantiate(this.scoreFXPrefab).getComponent(ScoreFX);
            fx.init(this);
            return fx;
        }
    }

    despawnScoreFX (scoreFX) {
        this.scorePool.put(scoreFX);
    }

    // called every frame
    update (dt) {
        if (!this.isRunning) return;
        // 每帧更新计时器，超过限度还没有生成新的星星
        // 就会调用游戏失败逻辑
        if (this.timer > this.starDuration) {
            this.gameOver();
            return;
        }
        this.timer += dt;
    }

    gameOver () {
       this.gameOverNode.active = true;
       this.player.enabled = false;
       this.player.stopMove();
       this.currentStar.destroy();
       this.isRunning = false;
       this.btnNode.setPositionX(0);
    }
}

```