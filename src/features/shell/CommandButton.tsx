import { appCommand } from '../../commands/appCommands';
import { Button, type ButtonProps } from '../../ui';

export type CommandButtonProps = Omit<ButtonProps, 'icon' | 'children' | 'onClick'> & {
  /** App command id, e.g. "app.sample": the label and icon come from the registry. */
  command: string;
  onCommand: (id: string) => void;
};

/** A button for an app command, so the label and icon match the palette and the cheat sheet. */
export function CommandButton({ command: id, onCommand, ...rest }: CommandButtonProps) {
  const command = appCommand(id);
  return (
    <Button icon={command.icon} onClick={() => onCommand(id)} {...rest}>
      {command.label}
    </Button>
  );
}
