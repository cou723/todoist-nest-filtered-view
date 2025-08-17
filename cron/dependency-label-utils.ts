/**
 * 依存関係ラベルユーティリティ
 * goalTodoに基づくdep-ラベルの生成・管理機能を提供
 */

/**
 * Todo名から依存関係ラベル名を生成する
 * 
 * ラベル名生成ルール:
 * - 親なし: dep-Todo名
 * - 親あり: dep-親Todo名-子Todo名
 * - 空白は'_'に変換
 * - 50文字制限で切り詰め
 * 
 * @param todoName 子Todo名
 * @param parentName 親Todo名（オプション）
 * @returns 生成されたラベル名
 */
export function generateDepLabelName(todoName: string, parentName?: string): string {
  // 空白を'_'に置換し、連続する'_'を単一にする
  const normalizeName = (name: string): string => {
    return name
      .replace(/\s+/g, '_')  // 空白を'_'に変換
      .replace(/_+/g, '_')   // 連続する'_'を単一に
      .replace(/^_+|_+$/g, ''); // 先頭・末尾の'_'を除去
  };

  const normalizedTodoName = normalizeName(todoName);
  
  let labelName: string;
  
  if (parentName) {
    const normalizedParentName = normalizeName(parentName);
    labelName = `dep-${normalizedParentName}-${normalizedTodoName}`;
  } else {
    labelName = `dep-${normalizedTodoName}`;
  }

  // 50文字制限で切り詰め
  if (labelName.length > 50) {
    labelName = labelName.substring(0, 50);
  }

  return labelName;
}

/**
 * 既存のgoalTodoリストから必要なdep-ラベル名を生成する
 * 
 * @param goalTodos goalTodoのリスト
 * @returns 生成すべきラベル名の配列
 */
export function generateRequiredDepLabels(goalTodos: { content: string; parentId?: string }[]): string[] {
  // parentIdがあるものについては、親の情報も必要になるため
  // この関数では親情報を含むTodoオブジェクトを受け取る設計に後で変更する
  return goalTodos.map(todo => generateDepLabelName(todo.content));
}

/**
 * ラベル名が依存関係ラベルかどうかを判定する
 * 
 * @param labelName ラベル名
 * @returns dep-で始まる場合true
 */
export function isDepLabel(labelName: string): boolean {
  return labelName.startsWith('dep-');
}

/**
 * dep-ラベル名から元のTodo名を推定する（デバッグ用）
 * 
 * @param depLabelName dep-ラベル名
 * @returns 推定されるTodo名
 */
export function extractTodoNameFromDepLabel(depLabelName: string): string | null {
  if (!isDepLabel(depLabelName)) {
    return null;
  }

  const namesPart = depLabelName.substring(4); // "dep-"を除去
  
  // "-"で分割して子Todo名を取得（親子関係の区切り）
  if (namesPart.includes('-')) {
    const parts = namesPart.split('-');
    return parts[parts.length - 1]; // 最後の部分が子Todo名
  }
  
  return namesPart;
}