// TODO(replace): Replace curated outputs, pipeline timings and identity metrics
// with production job artifacts and telemetry when the inference service is connected.
// The presentation adapter intentionally keeps the final product UI independent of that service.
const root = "/uploads/wardrobe-lab-v4";
export const looks = [
  { name: "原始人物", tag: "SOURCE", image: `${root}/looks/00-source-v4.webp` },
  {
    name: "驼色大衣",
    tag: "SOFT STRUCTURE",
    image: `${root}/looks/01-coat-v4.webp`,
  },
  {
    name: "黑色西装",
    tag: "MODERN TAILORING",
    image: `${root}/looks/02-suit-v4.webp`,
  },
  {
    name: "银灰夹克",
    tag: "SILVER FORM",
    image: `${root}/looks/03-jacket-v4.webp`,
  },
  {
    name: "城市街头",
    tag: "OFF DUTY",
    image: `${root}/looks/04-street-v4.webp`,
  },
  {
    name: "西部麂皮",
    tag: "WESTERN SPIRIT",
    image: `${root}/looks/05-western-v4.webp`,
  },
  {
    name: "未来盔甲",
    tag: "BEYOND REALITY",
    image: `${root}/looks/06-armor-v4.webp`,
  },
  {
    name: "深夜礼服",
    tag: "AFTER HOURS",
    image: `${root}/looks/07-evening-v4.webp`,
  },
];
export const stages = [
  {
    name: "输入原图",
    detail: "统一尺寸与色彩空间，建立人物基准。",
    image: `${root}/pipeline/01-input-v4.webp`,
    time: "0.3s",
    engine: "LOCAL",
  },
  {
    name: "精细抠图",
    detail: "保留发丝与衣物边缘，分离人物和背景。",
    image: `${root}/pipeline/02-cutout-v4.webp`,
    time: "1.1s",
    engine: "LOCAL",
  },
  {
    name: "身体解析",
    detail: "识别身体区域，为服装替换建立精确边界。",
    image: `${root}/pipeline/03-parsing-v4.webp`,
    time: "1.4s",
    engine: "ONNX",
  },
  {
    name: "自然美颜",
    detail: "调整肤色与光影，保留五官和皮肤纹理。",
    image: `${root}/pipeline/04-beauty-v4.webp`,
    time: "0.9s",
    engine: "LOCAL",
  },
  {
    name: "服装生成",
    detail: "匹配身体姿态，重建面料、剪裁与褶皱。",
    image: "/projects/wardrobe-lab/pipeline-dressed.webp",
    time: "9.8s",
    engine: "CLOUD",
  },
  {
    name: "场景合成",
    detail: "协调环境光与接触阴影，完成最终成片。",
    image: `${root}/pipeline/06-final-v4.webp`,
    time: "0.7s",
    engine: "LOCAL",
  },
];
// TODO(replace): Connect camera/video inference streams. Source assets: Decart Lucy official demo.
export const motionLooks = [
  { name: "原始", id: "base" },
  { name: "西装", id: "05" },
  { name: "夹克", id: "04" },
  { name: "街头", id: "03" },
  { name: "西部", id: "02" },
  { name: "盔甲", id: "01" },
];
export const motionPath = (id: string, extension = "mp4") =>
  `/projects/wardrobe-lab/lucy/${id}.${extension}`;
