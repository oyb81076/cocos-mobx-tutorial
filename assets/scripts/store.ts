import { observable, action, computed } from 'mobx'
enum State {
    NONE = 0,// 游戏还没开始
    PLAYING = 1,// 游戏进行中
    OVER = 2, //游戏结束
}

const { NONE, PLAYING, OVER } = State
class Store {
    // 弹跳高度
    public readonly jumpHeight = 180
    // 弹跳时间
    public readonly jumpDuration = 0.3
    // 辅助形变动作时间
    public readonly squashDuration = 0.1
    // 最大移动速度
    public readonly maxMoveSpeed = 550
    // 加速度
    public readonly accel = 450
    // 屏幕宽度
    public width = 0
    // 平移速度
    public xSpeed = 0
    // 星星和主角之间的距离小于这个数值时，就会完成收集
    public readonly pickRadius = 60

    // 星星产生后消失时间的随机范围
    private readonly maxStarDuration = 10
    private readonly minStarDuration = 5

    public readonly NONE = NONE
    public readonly PLAYING = PLAYING
    public readonly OVER = OVER

    // 获取地平面的 y 轴坐标
    @observable
    public groundY: number = 0
    // 得分
    @observable
    public score = 0
    // 界面状态
    @observable
    public state: State = NONE
    @computed
    public get playing() { return this.state === PLAYING }
    // 禁止 store.state = xxx 修改state的值
    // 强制走 setState()方法 , 因为修改state的时候需要处理一些业务状态

    // 初始化界面信息
    @action
    public init(canvas: cc.Node, ground: cc.Node) {
        this.width = canvas.width
        this.groundY = ground.y + ground.height / 2
    }

    // 修改 state
    @action
    public setState(state: State) {
        this.state = state
    }

    // 计时器
    private timer = 0
    // 星星的生存周期
    private starDuration = 0
    // 增加计时器并返回是否超时
    public addTimerAndReturnIsTimeout(dt: number) {
        return (this.timer += dt) > this.starDuration
    }
    @observable public starX: number = 0
    @observable public starY: number = 0
    // 前一个星星的位置 (给ScoreFx用的)
    public prevStarPos: cc.Vec2 = cc.p(0, 0)
    public currStarPos: cc.Vec2 = cc.p(0, 0)
    // 生成一个新的星星坐标
    public updateStarPos(): void {
        // 根据地平面位置和主角跳跃高度，随机得到一个星星的 y 坐标
        const randY = this.groundY + cc.random0To1() * this.jumpHeight + 50;
        // 根据屏幕宽度和上一个星星的 x 坐标，随机得到一个新生成星星 x 坐标
        const randX = (this.starX > 0 ? -1 : 1) * cc.random0To1() * this.width / 2
        this.timer = 0
        this.starDuration = store.minStarDuration + cc.random0To1() * (store.maxStarDuration - store.minStarDuration)
        this.starX = randX
        this.starY = randY
        this.prevStarPos = this.currStarPos
        this.currStarPos = cc.p(this.starX, this.starY)
    }

    // 增加1分
    @action
    public addScore() {
        this.score++
        this.updateStarPos()
    }
}
export const store = new Store
// 方便调试
if (cc.sys.isBrowser) { (window as any).store = store }