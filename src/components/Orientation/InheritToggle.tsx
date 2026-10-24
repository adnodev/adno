type Props = {
    checked: boolean,
    label: string,
    onToggle(): void
}

export function InheritToggle({ checked, label, onToggle }: Props) {
    return (
        <label className="orientation-inherit">
            <input type="checkbox"
                className="toggle toggle-xs"
                checked={checked}
                onChange={onToggle} />
            <span>{label}</span>
        </label>
    )
}
