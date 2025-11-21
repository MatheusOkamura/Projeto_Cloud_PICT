# INSTRUCOES PARA CORRIGIR O ERRO DE DEPLOY DO BACKEND

## Problema
O GitHub Actions esta falhando ao fazer deploy do backend porque o publish profile esta invalido ou desatualizado.

## Solucao

### Opcao 1: Baixar Publish Profile pelo Portal do Azure (RECOMENDADO)

1. Acesse o Portal do Azure: https://portal.azure.com

2. Navegue ate o App Service "Pictback":
   - Pesquise por "Pictback" na barra de pesquisa
   - Ou acesse diretamente: https://portal.azure.com/#@/resource/subscriptions/c1ccd263-cd87-4e1a-b12c-f3412a28cac1/resourceGroups/PICTIBMEC/providers/Microsoft.Web/sites/Pictback

3. No menu superior, clique em "Get publish profile" (icone de download)
   - Isso vai baixar um arquivo .PublishSettings

4. Abra o arquivo baixado com um editor de texto (Notepad, VS Code, etc.)

5. Copie TODO o conteudo do arquivo XML

6. Acesse o GitHub:
   - Va para: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/settings/secrets/actions
   - Procure pelo secret "AZURE_WEBAPP_PUBLISH_PROFILE"
   - Clique em "Update" (ou "New repository secret" se nao existir)
   - Cole o conteudo completo do arquivo XML
   - Clique em "Update secret"

7. Faca um novo push ou re-execute o workflow:
   - Acesse: https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions
   - Clique no workflow que falhou
   - Clique em "Re-run jobs"

### Opcao 2: Habilitar o Workflow OIDC (Mais Seguro)

Se voce tiver permissoes de administrador no Azure AD, pode configurar OIDC:

1. Execute o script: .\configurar-oidc-github.ps1
2. Siga as instrucoes para adicionar os secrets no GitHub
3. O workflow deploy-backend-oidc.yml vai funcionar automaticamente

## Verificacao

Depois de atualizar o secret, verifique se o deploy funciona:
- https://github.com/MatheusOkamura/Projeto_Cloud_PICT/actions

O backend deve ser deployado em:
- https://pictback-bzakbsfgc6bgcjcc.brazilsouth-01.azurewebsites.net
