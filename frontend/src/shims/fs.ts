// ブラウザ環境で Node の fs を呼ばせないためのスタブ（呼ばれたら明示的に落とす）
export const createReadStream = (): never => {
	throw new Error(
		"createReadStream is not available in the browser environment.",
	);
};
