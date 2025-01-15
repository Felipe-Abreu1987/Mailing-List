import sys
import win32com.client as win32

def main():
    # Parâmetros esperados: to, bcc, subject, message
    if len(sys.argv) < 5:
        print("Uso: outlook_integration.py <to> <bcc> <subject> <message>", file=sys.stderr)
        sys.exit(1)

    to = sys.argv[1]
    bcc = sys.argv[2]
    subject = sys.argv[3]
    message = sys.argv[4]

    try:
        outlook = win32.Dispatch("outlook.application")
        mail = outlook.CreateItem(0)
        mail.To = to
        mail.CC = ""
        mail.BCC = bcc
        mail.Subject = subject
        mail.Body = message
        # Abre o e-mail no Outlook para revisão
        mail.Display()
    except Exception as e:
        print(f"Erro ao enviar para o Outlook: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
