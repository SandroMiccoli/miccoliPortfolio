from django.http import HttpResponse
from django.template import loader

from .models import Project, Image, Credit

from .settings import MEDIA_URL


def index(request):
	template = loader.get_template('miccoliPortfolio/index.html')
	
	projects = Project.objects.filter(image__cover=True, front_page=True).values('title','slug','short_description','category','image__image').order_by('-date')

	# print(projects)

	context = {
		'projects': projects,
		'MEDIA_URL': MEDIA_URL,
		# 'lang': request.session['lang'] # TODO: Add session lang
		 'lang': 'en'
	}

	return HttpResponse(template.render(context, request))

def project_detail(request, title):
	template = loader.get_template('miccoliPortfolio/project-page.html')
	project = Project.objects.get(slug=title)
	images = Image.objects.all().filter(project_id=project.id)
	credits_titles = Credit.objects.all().filter(project_id=project.id).values_list(
		'title', flat=True).distinct()
	credits = Credit.objects.all().filter(project_id=project.id)
	year = project.date.year
	cover = Image.objects.get(project_id=project.id, cover=True)

	context = {
		'project': project,
		'MEDIA_URL': MEDIA_URL,
		'images': images,
		'credits_titles': credits_titles,
		'credits': credits,
		'cover':cover,
		'year': year
	}
	return HttpResponse(template.render(context, request))

def about(request):
	template = loader.get_template('miccoliPortfolio/about.html')
	context = {
	
	}
	return HttpResponse(template.render(context, request))


def switch_to_English_link(request):
    request.session['lang'] = 'en'
    return index(request)


def switch_to_Portuguese_link(request):
    request.session['lang'] = 'pt-br'
    return index(request)