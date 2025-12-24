export class TodoLabel {
  constructor(public readonly title: string) {
  }

  equals(other: TodoLabel): boolean {
    return this.title === other.title;
  }

  toString(): string {
    return this.title;
  }

  isDependencyLabel(): boolean {
    return this.title.startsWith("dep-");
  }

  static createDependencyLabel(
    todoName: string,
    parentName?: string,
  ): string {
    const normalizeName = (name: string): string => {
      return name
        .replace(/\s+/g, "_") // 空白を'_'に変換
        .replace(/_+/g, "_") // 連続する'_'を単一に
        .replace(/^_+|_+$/g, ""); // 先頭・末尾の'_'を除去
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
}
