from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "pulsa-manual-de-uso-diretoria-operacoes-rh.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

font_dir = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("ArialGuide", str(font_dir / "arial.ttf")))
pdfmetrics.registerFont(TTFont("ArialGuideBold", str(font_dir / "arialbd.ttf")))
pdfmetrics.registerFontFamily("ArialGuide", normal="ArialGuide", bold="ArialGuideBold")

INK = colors.HexColor("#153039")
TEAL = colors.HexColor("#073F42")
TEAL2 = colors.HexColor("#19686A")
MUTED = colors.HexColor("#5D7078")
LIGHT = colors.HexColor("#EAF4F3")
LINE = colors.HexColor("#D8E4E5")
WHITE = colors.white
AMBER = colors.HexColor("#FFF5DE")

W, H = A4
LEFT = RIGHT = 45
TOP = 55
BOTTOM = 49
CONTENT_W = W - LEFT - RIGHT

styles = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="ArialGuideBold", fontSize=9, leading=13, textColor=TEAL2, spaceAfter=10),
    "cover_title": ParagraphStyle("cover_title", fontName="ArialGuideBold", fontSize=31, leading=38, textColor=TEAL, spaceAfter=16),
    "cover_sub": ParagraphStyle("cover_sub", fontName="ArialGuide", fontSize=14, leading=21, textColor=INK, spaceAfter=24),
    "h1": ParagraphStyle("h1", fontName="ArialGuideBold", fontSize=19, leading=25, textColor=TEAL, spaceBefore=14, spaceAfter=12, keepWithNext=True),
    "h2": ParagraphStyle("h2", fontName="ArialGuideBold", fontSize=12.3, leading=18, textColor=TEAL, spaceBefore=15, spaceAfter=6, keepWithNext=True),
    "body": ParagraphStyle("body", fontName="ArialGuide", fontSize=10.2, leading=15.5, textColor=INK, spaceAfter=8),
    "small": ParagraphStyle("small", fontName="ArialGuide", fontSize=9, leading=13.2, textColor=INK, spaceAfter=6),
    "muted": ParagraphStyle("muted", fontName="ArialGuide", fontSize=9, leading=13.5, textColor=MUTED, spaceAfter=6),
    "step_no": ParagraphStyle("step_no", fontName="ArialGuideBold", fontSize=10, leading=15, textColor=TEAL, alignment=TA_CENTER),
    "step": ParagraphStyle("step", fontName="ArialGuide", fontSize=10, leading=15, textColor=INK),
    "th": ParagraphStyle("th", fontName="ArialGuideBold", fontSize=9.2, leading=13, textColor=WHITE),
    "td": ParagraphStyle("td", fontName="ArialGuide", fontSize=9, leading=13.2, textColor=INK),
    "call": ParagraphStyle("call", fontName="ArialGuide", fontSize=9.6, leading=14.5, textColor=INK),
    "toc": ParagraphStyle("toc", fontName="ArialGuide", fontSize=11, leading=18, textColor=INK, spaceAfter=11),
}

story = []

def P(text, style="body"):
    return Paragraph(text, styles[style])

def add(text, style="body"):
    story.append(P(text, style))

def h1(text):
    add(escape(text), "h1")

def h2(text):
    add(escape(text), "h2")

def step(n, text):
    t = Table([[P(str(n), "step_no"), P(text, "step")]], colWidths=[30, CONTENT_W - 30])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, 0), 4),
        ("RIGHTPADDING", (0, 0), (0, 0), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
    ]))
    story.append(t)
    story.append(Spacer(1, 4))

def box(label, text, warn=False):
    bg = AMBER if warn else LIGHT
    content = P(f"<b>{escape(label)}</b><br/>{text}", "call")
    t = Table([[content]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.append(Spacer(1, 6))
    story.append(t)
    story.append(Spacer(1, 10))

def grid(headers, rows, widths):
    cells = [[P(escape(x), "th") for x in headers]]
    cells += [[P(x, "td") for x in row] for row in rows]
    t = Table(cells, colWidths=widths, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F5F9F8")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

def page(canvas, doc):
    canvas.saveState()
    if doc.page == 1:
        canvas.setFillColor(LIGHT)
        canvas.rect(0, H - 100, W, 100, fill=1, stroke=0)
        canvas.setFillColor(TEAL)
        canvas.circle(LEFT + 10, H - 53, 8, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#8FC9B8"))
        canvas.circle(LEFT + 23, H - 61, 5, fill=1, stroke=0)
        canvas.circle(LEFT + 25, H - 44, 4, fill=1, stroke=0)
        canvas.setFont("ArialGuideBold", 19)
        canvas.setFillColor(TEAL)
        canvas.drawString(LEFT + 39, H - 60, "pulsa")
    else:
        canvas.setStrokeColor(LINE)
        canvas.line(LEFT, H - 37, W - RIGHT, H - 37)
        canvas.setFont("ArialGuideBold", 8)
        canvas.setFillColor(TEAL)
        canvas.drawString(LEFT, H - 29, "PULSA  /  GUIA DE USO")
    canvas.setStrokeColor(LINE)
    canvas.line(LEFT, 34, W - RIGHT, 34)
    canvas.setFont("ArialGuide", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(LEFT, 21, "Guia para Diretoria de Operações e RH  |  24 set 2026")
    canvas.drawRightString(W - RIGHT, 21, str(doc.page))
    canvas.restoreState()

doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=LEFT, rightMargin=RIGHT,
                      topMargin=TOP, bottomMargin=BOTTOM, title="Pulsa - Manual de uso",
                      author="Pulsa", subject="Guia prático para diretoria de operações e RH")
frame = Frame(LEFT, BOTTOM, CONTENT_W, H - TOP - BOTTOM, leftPadding=0, rightPadding=0,
              topPadding=0, bottomPadding=0)
doc.addPageTemplates(PageTemplate(id="guide", frames=frame, onPage=page))

# CAPA
story.append(Spacer(1, 105))
add("GUIA PRÁTICO  /  VERSÃO PARA APRESENTAÇÃO", "eyebrow")
add("Como usar o Pulsa", "cover_title")
add("Do cadastro da operação ao acompanhamento do trabalho: um roteiro simples para a Diretoria de Operações e a Diretoria de RH.", "cover_sub")
box("O que este guia cobre", "As funções que já aparecem no sistema: estrutura comercial e operacional, colaboradores, alocações, escalas, ausências, substituições, presença, acesso do colaborador e acompanhamento.")
add("Use este material em uma conta de demonstração com dados fictícios. Os botões disponíveis podem variar conforme o perfil de acesso.", "muted")
story.append(Spacer(1, 85))
add("Edição de 24 de setembro de 2026  ·  Aplicação atual", "muted")
story.append(PageBreak())

# ABERTURA
h1("1. Antes de começar")
add("O Pulsa organiza a operação em uma sequência fácil de lembrar:")
box("Caminho principal", "<b>Cliente → Contrato → Operação → Unidade → Cargo e posto → Colaborador → Alocação → Escala → Ausência, substituição e presença.</b>")
add("O menu lateral agrupa as áreas em <b>Rotina</b>, <b>Estrutura</b>, <b>Pessoas</b>, <b>Clientes e contratos</b> e <b>Administração</b>. Abra o grupo desejado para ver suas páginas. No celular, use o botão de menu no alto da tela. Clique no nome de um registro para abrir o detalhe.")
add("Para encontrar uma página ou tarefa, use <b>Buscar no Pulsa</b> no menu. No computador, Ctrl+K também abre essa busca. Ela leva à área escolhida; para encontrar um registro específico, use a busca ou os filtros da própria lista.")
h2("Entrar e sair")
step(1, "Abra o endereço do Pulsa informado pela equipe e use <b>E-mail</b> e <b>Senha</b> na tela de entrada. Clique em <b>Entrar</b>.")
step(2, "Ao terminar, use o menu da conta para <b>Sair</b>. Não compartilhe a senha nem deixe a sessão aberta em um computador compartilhado.")
h2("Escolher o recorte da consulta")
add("No alto do menu lateral há o seletor que mostra <b>Todos os clientes</b>. Ele permite trabalhar com um cliente ou contrato específico. Para voltar à visão completa, selecione <b>Todos os clientes</b> novamente. A escolha muda o recorte de algumas listas e da Visão geral; ela não altera cadastros nem concede acesso extra.")
box("Se um botão não aparece", "O sistema mostra ações conforme o perfil de cada pessoa. Peça à pessoa responsável pelos acessos para confirmar seu perfil antes de interpretar a ausência de um botão como defeito.")

h1("2. O que cada pessoa costuma fazer")
grid(["Perfil", "Uso típico neste guia"], [
    ["Diretoria de Operações", "Acompanha toda a jornada, configura operações e escalas, trata exceções e consulta Administração."],
    ["Diretoria de RH", "Consulta o contexto operacional, cadastra e atualiza colaboradores e acompanha os vínculos. Algumas ações operacionais dependem do perfil atribuído à conta."],
    ["Supervisor", "Acompanha escalas, ausências, substituições e presença conforme as permissões concedidas."],
    ["Colaborador", "Usa a área <b>Pulsa Worker</b> para ver a própria programação e registrar chegada ou saída quando a ação estiver disponível."],
], [135, CONTENT_W - 135])
add("O nome do cargo da pessoa na empresa e o perfil configurado no Pulsa podem não ser iguais. Neste guia, 'Diretoria de RH' descreve o público da apresentação; os botões reais dependem do perfil da conta.", "small")

h1("3. Preparar a estrutura da operação")
add("A ordem abaixo evita campos vazios e opções indisponíveis nos formulários. Use um cliente e uma unidade fictícios na demonstração.")
step(1, "Em <b>Clientes</b>, clique em <b>Novo cliente</b>. Informe razão social, nome fantasia e CNPJ; salve. Abra o cliente para conferir o cadastro.")
step(2, "Em <b>Contratos</b>, clique em <b>Novo contrato</b>. Escolha o cliente, informe o nome do contrato e as datas de vigência. A referência externa é opcional.")
step(3, "Abra o contrato salvo e, nas ações de situação, passe de <b>Rascunho</b> para <b>Ativo</b>. Um contrato recém-criado ainda não está pronto para a operação.")
step(4, "Em <b>Operações</b>, clique em <b>Nova operação</b>. Escolha o contrato ativo, dê um nome e informe o período. A descrição ajuda a reconhecer o trabalho. A Direção pode atribuir um gestor responsável opcional, selecionando-o pelo nome e papel.")
step(5, "Em <b>Unidades</b>, clique em <b>Nova unidade</b>. Escolha a operação, informe nome e localização. Selecione a região de fuso horário da unidade; ela orienta a exibição dos horários de escala e presença.")
step(6, "Abra a operação e use as ações de situação nesta ordem: <b>Avançar para implantação</b> e depois <b>Ativar operação</b>. A operação nasce em Planejamento; precisa chegar a Ativa para a jornada operacional da demonstração.")
step(7, "Em <b>Cargos</b>, cadastre a função que pode ser reutilizada, por exemplo, Promotor. Em <b>Postos</b>, vincule esse cargo a uma unidade e informe o <b>Efetivo base necessário</b>.")
box("Cargo, posto e efetivo base", "<b>Cargo</b> é a função reutilizável. <b>Posto</b> é essa função em uma unidade concreta. <b>Efetivo base</b> é a quantidade estrutural desejada naquele posto; não é uma escala publicada nem prova de presença.")

h1("4. Cadastrar colaboradores e alocar")
h2("Cadastrar uma pessoa")
step(1, "Entre em <b>Colaboradores</b> e clique em <b>Novo colaborador</b>. Preencha <b>Nome completo</b> e <b>CPF</b>; contato e datas de vínculo são opcionais.")
step(2, "Clique em <b>Cadastrar colaborador</b>. O registro aparece na lista. Use a busca por nome ou CPF e o filtro de situação para localizá-lo depois.")
step(3, "Abra o colaborador e use <b>Ativar colaborador</b> nas ações de situação. Repita para cada pessoa fictícia que participará da escala.")
step(4, "No detalhe, confira dados, alocação atual e histórico. Use <b>Editar</b> para corrigir informações cadastrais, se o seu perfil permitir.")
box("Cadastro não é acesso ao aplicativo", "Criar um colaborador não cria automaticamente uma conta para ele entrar no Pulsa Worker. O convite de acesso é uma etapa separada, disponível à Direção.")
h2("Vincular a um posto")
step(1, "Entre em <b>Alocações</b> e clique em <b>Nova alocação</b>. Selecione o colaborador e o posto.")
step(2, "Informe a <b>Data inicial</b>. A data final é opcional. Salve e abra o registro para conferir unidade, cargo, posto e período.")
step(3, "No detalhe da alocação, passe a situação de <b>Pendente</b> para <b>Ativa</b>. Faça isso para cada pessoa que será usada na programação e confira se a vigência cobre o dia da escala.")
step(4, "Quando a relação terminar, altere sua situação pelo detalhe da alocação, conforme as ações exibidas para o seu perfil.")
add("Uma alocação diz <b>onde a pessoa está vinculada</b>. Ela não diz em quais dias ou horários a pessoa foi programada e não confirma que ela compareceu.")

h1("5. Planejar e publicar uma escala")
step(1, "Em <b>Escalas</b>, clique em <b>Nova escala</b>. Escolha a operação e o período. Você pode <b>Criar do zero</b> ou <b>Copiar escala anterior</b> já publicada.")
step(2, "Abra a escala criada. Use as visões <b>Semanal</b>, <b>Dia</b> ou <b>Colaborador</b> para revisar a programação.")
step(3, "Enquanto a revisão estiver em rascunho, clique em <b>Adicionar colaborador</b> no dia e posto desejados. Selecione uma pessoa com alocação elegível e informe início, fim e, se houver, intervalo.")
step(4, "Revise unidade, colaborador, horário e período. Para alterar uma jornada, clique em <b>Gerenciar</b> na entrada. A janela oferece edição, cópia para dias válidos e remoção. Essas ações dependem do estado da revisão.")
step(5, "Quando estiver pronta, use <b>Enviar para aprovação</b>, depois <b>Aprovar</b> e <b>Publicar</b>. Confira a janela e clique em <b>Confirmar publicação</b>. Só a versão publicada é oficial. Para alterar uma versão publicada, crie uma nova revisão; a anterior permanece no histórico.")
box("O que conferir antes de publicar", "O contrato e a operação estão ativos? Cada colaborador está ativo e com alocação ativa e vigente? O período, os horários e o fuso da unidade estão corretos? Uma escala em rascunho ou aprovada ainda não é a versão oficial para o colaborador.", warn=True)

h1("6. Tratar ausência e substituição")
h2("Registrar uma ausência")
step(1, "Na escala, localize a entrada do colaborador programado e clique em <b>Registrar ausência</b>.")
step(2, "Escolha o motivo, inclua apenas a observação necessária e clique em <b>Registrar ausência</b>. A entrada planejada continua visível, agora com o aviso de ausência.")
step(3, "Em <b>Ausências</b>, acompanhe os registros. O filtro <b>Sem cobertura</b> ajuda a localizar situações ainda sem substituto.")
h2("Definir cobertura")
step(1, "Abra o detalhe da ausência. Na seção <b>Substituição</b>, clique em <b>Definir substituto</b>.")
step(2, "Escolha uma pessoa elegível apresentada pelo sistema e confirme. O horário e o posto da entrada permanecem os mesmos.")
step(3, "Se não houver candidatos, o sistema mostra o aviso. Revise alocações e elegibilidade antes de tentar novamente.")
add("Registrar ausência e definir substituto são decisões diferentes. Uma ausência sem substituto continua sem cobertura. A substituição planejada também não prova que a pessoa compareceu.")

h1("7. Acompanhar a presença do dia")
step(1, "Entre em <b>Presença</b> e navegue até o dia desejado. A lista mostra horário, colaborador esperado, estado e ação disponível.")
step(2, "Quando a pessoa chegar, use <b>Registrar chegada</b>. Ao encerrar, use <b>Registrar saída</b>. O detalhe <b>Planejado × realizado</b> permite comparar horários.")
step(3, "Se houver erro em um registro, abra o detalhe para usar a correção ou o cancelamento permitido ao seu perfil. Preserve o registro correto em vez de tratar uma ausência de confirmação como falta automática.")
box("Leitura correta dos estados", "<b>Escala</b> é o planejado; <b>Ausência</b> é um impedimento registrado; <b>Substituição</b> é a cobertura definida; <b>Presença</b> é o comparecimento efetivamente registrado. Sem registro de presença, a situação ainda é desconhecida.")

h1("8. Usar o Pulsa Worker")
add("Esta é a área do próprio colaborador, separada do Backoffice. Ela é mais simples e foi desenhada para uso no celular.")
h2("Convidar e ativar")
step(1, "No Backoffice, abra o detalhe de um colaborador e procure <b>Acesso ao Pulsa Worker</b>. O e-mail cadastrado aparece preenchido; confirme com a pessoa que ela pode receber o convite nesse endereço e clique em <b>Criar acesso e enviar convite</b>.")
step(2, "A pessoa abre o convite, informa o e-mail e o código recebido e confirma que o acesso pertence a ela. No primeiro acesso, ativa o vínculo e cria sua senha. A conta Worker fica separada da conta interna do Backoffice.")
step(3, "Para interromper o acesso, a Direção usa <b>Suspender acesso</b> ou <b>Revogar acesso</b>. Cada botão abre uma janela que explica o efeito, pede o motivo e exige confirmação. A suspensão pode ser revertida por <b>Reativar acesso</b>; a revogação é definitiva.")
h2("O que o colaborador vê")
grid(["Área", "Uso"], [
    ["Hoje", "Mostra o trabalho atual ou próximo e abre o detalhe da jornada."],
    ["Escala", "Permite consultar a própria programação por semana."],
    ["Histórico", "Mostra os próprios registros de presença."],
    ["Conta", "Mostra dados da conta, alteração de senha e saída."],
], [92, CONTENT_W - 92])
add("Quando a jornada permitir, o detalhe mostra <b>Registrar chegada</b> ou <b>Registrar saída</b>. O colaborador não escolhe outra pessoa, unidade ou horário ao fazer esse registro. Se uma substituição cobrir a jornada, a pessoa originalmente escalada vê que a jornada foi coberta e que não é esperada.")

h1("9. Acompanhar e administrar")
h2("Visão geral")
add("A <b>Visão geral</b> começa em <b>Requer atenção</b>: por exemplo, ausências sem cobertura, postos abaixo do efetivo base e colaboradores ativos sem alocação. Clique em uma pendência para investigar. Em <b>Ir direto ao trabalho</b>, abra as rotinas mais usadas. Para consultar os números da estrutura ativa, clique em <b>Ver indicadores</b>.")
box("Como interpretar os números", "<b>Alocações ativas</b> contam vínculos vigentes. <b>Efetivo base</b> soma a necessidade estrutural dos postos. Esses números não medem, por si, a cobertura da escala ou a presença do dia.")
h2("Administração")
add("O menu <b>Administração</b> é reservado à Direção. Em <b>Usuários</b>, abra uma pessoa para escolher um <b>Novo papel</b> e clicar em <b>Salvar papel</b>, ou para <b>Desativar acesso</b> após ler a confirmação. O último Diretor ativo não pode ser desativado. Essa tela não cria contas internas. Em <b>Auditoria</b>, consulte quem fez mudanças e quando; abra um evento para ver o detalhe. No celular, as listas mostram cada item em vez de colunas comprimidas.")

h1("10. Roteiro sugerido para a apresentação")
grid(["Tempo", "Demonstração"], [
    ["5 min", "Entrar, mostrar o menu e o seletor de cliente/contrato."],
    ["10 min", "Criar cliente, contrato, operação, unidade, cargo e posto fictícios; ativar contrato e operação."],
    ["8 min", "Cadastrar dois colaboradores, ativá-los, criar as alocações e ativá-las."],
    ["10 min", "Criar escala, adicionar jornada, aprovar e publicar."],
    ["7 min", "Registrar ausência, definir substituto e acompanhar presença."],
    ["5 min", "Mostrar a Visão geral, o detalhe do colaborador, acesso Worker e auditoria."],
], [65, CONTENT_W - 65])
add("Peça que cada pessoa execute ao menos uma ação no ambiente de demonstração. Anote onde a linguagem, a sequência ou a tela não corresponde à rotina real; esses pontos orientarão a próxima rodada de produto.")

h1("11. Perguntas frequentes")
h2("Cadastrei a pessoa, mas ela não aparece na escala. Por quê?")
add("Confirme se o contrato e a operação estão ativos, se a pessoa está ativa e se possui alocação ativa e vigente no posto e na data. Depois confira se você está na operação e no período corretos.")
h2("A escala foi salva. O colaborador já consegue vê-la?")
add("Confira se a revisão foi <b>Publicada</b>. Rascunho, pendência de aprovação e aprovação são etapas anteriores à publicação oficial.")
h2("A ausência desaparece quando escolho um substituto?")
add("Não. O sistema preserva o motivo da exceção e acrescenta a cobertura. Assim é possível entender o que foi planejado, o que mudou e quem compareceu.")
h2("Um colaborador cadastrado consegue entrar no Backoffice?")
add("Não por causa do cadastro. O registro da pessoa, a conta interna do Backoffice e o acesso ao Pulsa Worker são coisas diferentes.")
h2("Posso usar o Pulsa como relógio de ponto oficial?")
add("A função atual registra <b>presença operacional</b>. Ela não substitui um sistema trabalhista de ponto.")

h1("12. Limites da versão atual")
add("Este guia descreve as funções disponíveis agora. <b>Ocorrências, tarefas, checklists, fotos, chamados, cálculo de folha, ponto trabalhista e indicadores avançados</b> ainda não fazem parte desta jornada. O cadastro de novas contas internas também não é feito pela tela de Usuários.")
add("As regras finais de operação, responsabilidade por cada etapa e nomenclatura do dia a dia devem ser revisadas com a Diretoria de Operações e RH antes de um piloto real. O guia ensina a usar as telas existentes; não substitui a política operacional da Pulsa.")
box("Encerramento da sessão", "Ao final da demonstração, volte a <b>Todos os clientes</b>, confira os registros fictícios criados e saia da conta. Guarde comentários sobre dificuldades e termos pouco claros para ajustar o produto.")

doc.build(story)
print(OUT)
