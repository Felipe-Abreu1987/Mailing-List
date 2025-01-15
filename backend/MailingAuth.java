/**
 * Exemplo simples (ilustrativo) que seria chamado via CLI:
 * Param 0 -> username
 * Param 1 -> password
 */
public class MailingAuth {

    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Uso: java MailingAuth <username> <password>");
            System.exit(1); // Código 1 => erro de uso
        }

        String username = args[0];
        String password = args[1];

        // Exemplo de lógica de autenticação:
        // Em produção, normalmente faríamos query em DB, LDAP ou outro serviço externo.
        if ("admin".equals(username) && "1234".equals(password)) {
            System.out.println("Autenticado com sucesso!");
            System.exit(0); // Código 0 => sucesso
        } else {
            System.err.println("Falha na autenticação!");
            System.exit(2); // Código 2 => falha de autenticação
        }
    }
}

