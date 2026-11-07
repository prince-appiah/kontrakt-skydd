const TOKEN_SPLIT = /(\[[A-Z]+_\d+\])/;

export const RedactedTextTab = ({ text }: { text: string }) => (
    <div className="rounded-xl bg-primary p-6 text-md leading-7 whitespace-pre-wrap text-primary ring-1 ring-secondary ring-inset">
        {text.split(TOKEN_SPLIT).map((part, position) =>
            position % 2 === 1 ? (
                <mark key={position} className="rounded-sm bg-brand-secondary px-1 font-mono text-sm text-brand-primary">
                    {part}
                </mark>
            ) : (
                <span key={position}>{part}</span>
            ),
        )}
    </div>
);
