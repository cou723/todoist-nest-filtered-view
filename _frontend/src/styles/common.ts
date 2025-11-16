import { css } from "lit";

// レイアウト関連のみの共通スタイル
export const layoutStyles = css`
  .flex-column {
    display: flex;
    flex-direction: column;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .gap-small {
    gap: 0.5rem;
  }

  .gap-medium {
    gap: 1rem;
  }

  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }
`;
