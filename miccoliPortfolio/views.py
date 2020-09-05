from django.http import HttpResponse
from django.template import loader

from .models import Project, Image


def index(request):
	template = loader.get_template('miccoliPortfolio/index-webflow.html')
	
	projects = Project.objects.filter(image__cover=True, front_page=True).values('title','slug','short_description','category','image__image').order_by('-date')

	# print(projects)

	context = {
		'projects': projects,
		'lang': request.session['lang']
	}

	return HttpResponse(template.render(context, request))

def project_detail(request, title):
	template = loader.get_template('miccoliPortfolio/project-page-webflow.html')
	project = Project.objects.get(slug=title)
	context = {
		'project': project
	}
	return HttpResponse(template.render(context, request))

def temp_index(request):
	template = loader.get_template('miccoliPortfolio/index.html')
	context = {
	
	}
	return HttpResponse(template.render(context, request))


def switch_to_English_link(request):
    request.session['lang'] = 'en'
    return index(request)


def switch_to_Portuguese_link(request):
    request.session['lang'] = 'pt-br'
    return index(request)