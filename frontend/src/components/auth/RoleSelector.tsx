import { Check, Sprout, Warehouse } from "lucide-react";
import { ROLE_OPTIONS } from "../../auth/roles";
import type { MandiMintRole } from "../../auth/types";
import "./role-selector.css";

interface RoleSelectorProps {
  value: MandiMintRole;
  onChange: (role: MandiMintRole) => void;
  disabled?: boolean;
  legend?: string;
}

const ROLE_ICONS = {
  farmer: Sprout,
  fpo_admin: Warehouse,
} as const;

export function RoleSelector({
  value,
  onChange,
  disabled = false,
  legend = "Choose your role",
}: RoleSelectorProps) {
  return (
    <fieldset className="mm-role-selector" disabled={disabled}>
      <legend className="visually-hidden">{legend}</legend>
      {ROLE_OPTIONS.map((option) => {
        const Icon = ROLE_ICONS[option.value];
        const selected = value === option.value;

        return (
          <label
            key={option.value}
            className={[
              "mm-role-option",
              selected ? "mm-role-option--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="radio"
              name="mandimint-role"
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
            />
            <span className="mm-role-option__icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="mm-role-option__body">
              <span className="mm-role-option__label">{option.label}</span>
              <span className="mm-role-option__description">
                {option.description}
              </span>
            </span>
            <span className="mm-role-option__check" aria-hidden="true">
              {selected && <Check />}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
