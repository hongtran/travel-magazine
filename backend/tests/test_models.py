from app.models.article import ArticleOutput, SourcedField, BodySection

def test_article_output_parses_correctly():
    data = {
        "title": {"value": "Komodo Trip", "sourced": True, "source_ref": "Komodo trip notes"},
        "hook": {"value": "A wild dawn...", "sourced": True},
        "body": [{"section_title": "Getting There", "content": "Fly to Labuan Bajo", "source_ref": "Fly"}],
        "best_for": {"value": "Divers", "sourced": True},
        "not_for": {"value": "Luxury seekers", "sourced": False},
        "key_facts": {"price": {"value": "$120/night", "sourced": True, "source_ref": "$120"}},
    }
    output = ArticleOutput.model_validate(data)
    assert output.title.value == "Komodo Trip"
    assert output.not_for.sourced is False
    assert output.key_facts["price"].value == "$120/night"
    assert output.ethics_notes is None

def test_sourced_field_allows_null_value():
    field = SourcedField(value=None, sourced=False)
    assert field.value is None
    assert field.sourced is False
